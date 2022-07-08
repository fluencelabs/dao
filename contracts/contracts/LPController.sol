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

    uint24 public constant UNISWAP_FEE = 3000;

    ILiquidityBootstrappingPoolFactory public immutable balancerLBPFactory;
    IUniswapV3Factory public immutable uniswapFactory;
    IBalancerVault public immutable balancerVault;

    IERC20 public immutable token0;
    IERC20 public immutable token1;

    address public immutable executor;

    ILiquidityBootstrappingPool public liquidityBootstrappingPool;
    bytes32 public lbpPoolId;
    IUniswapV3Pool public uniswapPool;

    event CreateBalancerLBP(
        ILiquidityBootstrappingPool lbp,
        uint256[] weights,
        uint256[] endWeights,
        uint256[] initBalances,
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
        IERC20 token0_,
        IERC20 token1_
    ) {
        balancerLBPFactory = _balancerLBPFactory;
        uniswapFactory = _uniswapFactory;
        balancerVault = _balancerVault;
        executor = _executor;

        require(token0_ < token1_, "Token0 must be less than token1");

        token0 = token0_;
        token1 = token1_;
    }

    function uniswapV3MintCallback(
        uint256 amount0Owed,
        uint256 amount1Owed,
        bytes calldata /* data */
    ) external {
        require(msg.sender == address(uniswapPool), "Only for the pool");

        token0.safeTransfer(address(uniswapPool), amount0Owed);
        token1.safeTransfer(address(uniswapPool), amount1Owed);

        emit UniswapCallback(amount0Owed, amount1Owed);
    }

    function createBalancerLBP(
        uint256[] memory weights,
        uint256[] memory endWeights,
        uint256[] memory initBalances,
        uint256 lbpPoolDuration,
        uint256 swapFeePercentage
    ) external onlyOwner {
        require(
            address(liquidityBootstrappingPool) == address(0),
            "LBP already exists"
        );

        require(weights.length == 2, "LBP configs must be 2");
        require(endWeights.length == 2, "LBP configs must be 2");
        require(initBalances.length == 2, "LBP configs must be 2");

        IERC20[] memory assets = new IERC20[](2);
        assets[0] = token0;
        assets[1] = token1;

        ILiquidityBootstrappingPool lbp = ILiquidityBootstrappingPool(
            balancerLBPFactory.create(
                "Fluence LBP",
                "FLTLBP",
                assets,
                weights,
                swapFeePercentage,
                address(this),
                false
            )
        );

        bytes32 lbpPool = lbp.getPoolId();
        uint256 length = assets.length;

        for (uint256 i = 0; i < length; i++) {
            IERC20 token = assets[i];
            token.transferFrom(msg.sender, address(this), initBalances[i]);
            token.safeApprove(address(balancerVault), initBalances[i]);
        }

        IBalancerVault.JoinPoolRequest memory request = IBalancerVault
            .JoinPoolRequest({
                assets: assets,
                maxAmountsIn: initBalances,
                userData: abi.encode(0, initBalances),
                fromInternalBalance: false
            });

        balancerVault.joinPool(lbpPool, address(this), address(this), request);

        lbp.updateWeightsGradually(
            block.timestamp,
            block.timestamp + lbpPoolDuration,
            endWeights
        );

        lbp.setSwapEnabled(true);

        lbpPoolId = lbpPool;
        liquidityBootstrappingPool = lbp;

        emit CreateBalancerLBP(
            lbp,
            weights,
            endWeights,
            initBalances,
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

        IERC20[] memory assets = new IERC20[](2);
        assets[0] = token0;
        assets[1] = token1;

        IBalancerVault.ExitPoolRequest memory request = IBalancerVault
            .ExitPoolRequest({
                assets: assets,
                minAmountsOut: new uint256[](2),
                userData: abi.encode(0, 2, 0, bptBalance),
                toInternalBalance: false
            });

        balancerVault.exitPool(
            lbpPoolId,
            address(this),
            payable(address(this)),
            request
        );

        liquidityBootstrappingPool.setSwapEnabled(false);

        emit ExitFromBalancerLBP(
            token0.balanceOf(address(this)),
            token1.balanceOf(address(this))
        );
    }

    function createUniswapLP() external onlyOwner {
        require(
            address(uniswapPool) == address(0),
            "Uniswap pool already exists"
        );

        IUniswapV3Pool pool = IUniswapV3Pool(
            uniswapFactory.createPool(
                address(token0),
                address(token1),
                UNISWAP_FEE
            )
        );

        uniswapPool = pool;
        emit CreateUniswapLP(pool);
    }

    function addLiquidityToUniswapLP(
        int24 tickLower,
        int24 tickUpper,
        uint128 amount
    ) external onlyOwner {
        IUniswapV3Pool pool = uniswapPool;

        require(address(pool) != address(0), "Uniswap pool already exists");

        require(
            token0.balanceOf(address(this)) != 0,
            "Invalid balance of token0"
        );
        require(
            token1.balanceOf(address(this)) != 0,
            "Invalid balance of token1"
        );

        pool.mint(executor, tickLower, tickUpper, amount, new bytes(0));

        emit AddLiquidityToUniswapLP(tickLower, tickUpper, amount);
    }

    function withdraw(IERC20 token, uint256 amount) external onlyOwner {
        require(token.balanceOf(address(this)) != 0, "Invalid balance");

        token.safeTransfer(executor, amount);

        emit Withdraw(token, amount);
    }
}
