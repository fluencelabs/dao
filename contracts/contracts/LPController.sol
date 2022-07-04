// SPDX-License-Identifier: Apache-2.0

pragma solidity >=0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3MintCallback.sol";
import "./Balancer.sol";

contract LPController is Ownable, IUniswapV3MintCallback {
    using SafeERC20 for IERC20;

    struct LBPTokenConfig {
        uint256 weight;
        uint256 endWeight;
        uint256 initialAmount;
    }

    uint24 public constant UNISWAP_FEE = 3000;

    ILiquidityBootstrappingPoolFactory public immutable balancerLBPFactory;
    IUniswapV3Factory public immutable uniswapFactory;
    IBalancerVault public immutable balancerVault;

    IERC20[] public tokens;
    address public immutable executor;

    ILiquidityBootstrappingPool public liquidityBootstrappingPool;
    bytes32 public lbpPoolId;
    IUniswapV3Pool public uniswapPool;

    event CreateBalancerLBP(
        ILiquidityBootstrappingPool lbp,
        LBPTokenConfig[] lbpTokensConfigs,
        uint256 lbpPoolDuration,
        uint256 swapFeePercentage
    );
    event ExitFromBalancerLBP(uint256 amount0, uint256 amount1);
    event CreateUniswapLP(IUniswapV3Pool lp);
    event AddLiquidityToUniswapLP(
        int24 tickLower,
        int24 tickUpper,
        uint128 amount
    );
    event UniswapCallback(uint256 amount0Owed, uint256 amount01wed);
    event Withdraw(IERC20 token, uint256 amount);

    constructor(
        ILiquidityBootstrappingPoolFactory _balancerLBPFactory,
        IUniswapV3Factory _uniswapFactory,
        IBalancerVault _balancerVault,
        address _executor,
        IERC20 token0,
        IERC20 token1
    ) {
        balancerLBPFactory = _balancerLBPFactory;
        uniswapFactory = _uniswapFactory;
        balancerVault = _balancerVault;
        executor = _executor;

        require(token0 < token1, "Token0 must be less than token1");

        tokens.push(token0);
        tokens.push(token1);
    }

    function uniswapV3MintCallback(
        uint256 amount0Owed,
        uint256 amount1Owed,
        bytes calldata /* data */
    ) external {
        require(msg.sender == address(uniswapPool), "Only for the pool");

        tokens[0].safeTransfer(address(uniswapPool), amount0Owed);
        tokens[1].safeTransfer(address(uniswapPool), amount1Owed);

        emit UniswapCallback(amount0Owed, amount1Owed);
    }

    function createBalancerLBP(
        LBPTokenConfig[] memory lbpTokensConfigs,
        uint256 lbpPoolDuration,
        uint256 swapFeePercentage
    ) external onlyOwner {
        require(
            address(liquidityBootstrappingPool) == address(0),
            "LBP already exists"
        );

        require(lbpTokensConfigs.length >= 2, "LBP configs must be 2");

        uint256[] memory weights = new uint256[](2);
        uint256[] memory endWeights = new uint256[](2);
        uint256[] memory initBalances = new uint256[](2);

        for (uint256 i = 0; i < 2; i++) {
            weights[i] = lbpTokensConfigs[i].weight;
            endWeights[i] = lbpTokensConfigs[i].endWeight;
            initBalances[i] = lbpTokensConfigs[i].initialAmount;
        }

        liquidityBootstrappingPool = ILiquidityBootstrappingPool(
            balancerLBPFactory.create(
                "Fluence LBP",
                "FLTLBP",
                tokens,
                weights,
                swapFeePercentage,
                address(this),
                false
            )
        );

        lbpPoolId = liquidityBootstrappingPool.getPoolId();

        for (uint256 i = 0; i < tokens.length; i++) {
            tokens[i].transferFrom(msg.sender, address(this), initBalances[i]);
            tokens[i].safeApprove(address(balancerVault), initBalances[i]);
        }

        JoinPoolRequest memory request = JoinPoolRequest({
            assets: tokens,
            maxAmountsIn: initBalances,
            userData: abi.encode(0, initBalances),
            fromInternalBalance: false
        });

        balancerVault.joinPool(
            lbpPoolId,
            address(this),
            address(this),
            request
        );

        liquidityBootstrappingPool.updateWeightsGradually(
            block.timestamp,
            block.timestamp + lbpPoolDuration,
            endWeights
        );

        liquidityBootstrappingPool.setSwapEnabled(true);

        emit CreateBalancerLBP(
            liquidityBootstrappingPool,
            lbpTokensConfigs,
            lbpPoolDuration,
            swapFeePercentage
        );
    }

    function setSwapEnabledInBalancerLBP(bool swapEnabled) external onlyOwner {
        liquidityBootstrappingPool.setSwapEnabled(swapEnabled);
    }

    function exitFromBalancerLBP() external onlyOwner {
        uint256 bptBalance = IERC20(address(liquidityBootstrappingPool))
            .balanceOf(address(this));

        require(bptBalance > 0, "No BPT balance");

        IERC20(address(liquidityBootstrappingPool)).approve(
            address(balancerVault),
            bptBalance
        );

        ExitPoolRequest memory request = ExitPoolRequest({
            assets: tokens,
            minAmountsOut: new uint256[](tokens.length),
            userData: abi.encode(0, 2, 0, bptBalance),
            toInternalBalance: false
        });

        balancerVault.exitPool(
            lbpPoolId,
            address(this),
            payable(address(this)),
            request
        );

        emit ExitFromBalancerLBP(
            tokens[0].balanceOf(address(this)),
            tokens[1].balanceOf(address(this))
        );
    }

    function createUniswapLP() external onlyOwner {
        require(
            address(uniswapPool) == address(0),
            "Uniswap pool already exists"
        );

        uniswapPool = IUniswapV3Pool(
            uniswapFactory.createPool(
                address(tokens[0]),
                address(tokens[1]),
                UNISWAP_FEE
            )
        );

        emit CreateUniswapLP(uniswapPool);
    }

    function addLiquidityToUniswapLP(
        int24 tickLower,
        int24 tickUpper,
        uint128 amount
    ) external onlyOwner {
        require(
            address(uniswapPool) != address(0),
            "Uniswap pool already exists"
        );
        require(
            tokens[0].balanceOf(address(this)) != 0,
            "Invalid balance of token0"
        );
        require(
            tokens[1].balanceOf(address(this)) != 0,
            "Invalid balance of token1"
        );

        uniswapPool.mint(executor, tickLower, tickUpper, amount, new bytes(0));

        emit AddLiquidityToUniswapLP(tickLower, tickUpper, amount);
    }

    function withdraw(IERC20 token, uint256 amount) external onlyOwner {
        require(token.balanceOf(address(this)) != 0, "Invalid balance");

        token.safeTransfer(executor, amount);

        emit Withdraw(token, amount);
    }
}
