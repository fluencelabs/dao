pragma solidity 0.8.15;

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
    address public immutable executor;

    IERC20[] public tokens;

    ILiquidityBootstrappingPool public liquidityBootstrappingPool;
    bytes32 public lbpPoolId;
    IUniswapV3Pool public uniswapPool;

    constructor(
        ILiquidityBootstrappingPoolFactory _balancerLBPFactory,
        IUniswapV3Factory _uniswapFactory,
        IBalancerVault _balancerVault,
        address _executor,
        IERC20 _token0,
        IERC20 _token1
    ) {
        balancerLBPFactory = _balancerLBPFactory;
        uniswapFactory = _uniswapFactory;
        balancerVault = _balancerVault;
        executor = _executor;

        require(_token0 < _token1, "Token0 must be less than token1");
        tokens[0] = _token0;
        tokens[1] = _token1;
    }

    function uniswapV3MintCallback(
        uint256 amount0Owed,
        uint256 amount1Owed,
        bytes calldata /* data */
    ) external {
        require(msg.sender == address(uniswapPool), "Only for the pool");

        tokens[0].safeTransfer(address(uniswapPool), amount0Owed);
        tokens[1].safeTransfer(address(uniswapPool), amount1Owed);
    }

    function createBalancerLBP(
        uint256[] memory weights,
        uint256[] memory endWeight,
        uint256 poolDuration,
        uint256 swapFeePercentage
    ) external onlyOwner {
        require(
            address(liquidityBootstrappingPool) == address(0),
            "LBP already exists"
        );

        liquidityBootstrappingPool = ILiquidityBootstrappingPool(
            balancerLBPFactory.create(
                "Fluence LBP",
                "FLP",
                tokens,
                weights,
                swapFeePercentage,
                address(this),
                false
            )
        );

        lbpPoolId = liquidityBootstrappingPool.getPoolId();

        uint256[] memory initialBalances = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            initialBalances[i] = tokens[i].balanceOf(address(this));
            tokens[i].safeApprove(
                address(liquidityBootstrappingPool),
                initialBalances[i]
            );
        }

        JoinPoolRequest memory request = JoinPoolRequest({
            assets: tokens,
            maxAmountsIn: initialBalances,
            userData: abi.encode(0, initialBalances),
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
            block.timestamp + poolDuration,
            endWeight
        );

        liquidityBootstrappingPool.setSwapEnabled(true);
    }

    function setSwapEnabled(bool swapEnabled) external onlyOwner {
        liquidityBootstrappingPool.setSwapEnabled(swapEnabled);
    }

    function exitBalancer() external onlyOwner {
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
    }

    function createUniswap() external onlyOwner {
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
    }

    function transferLiquidityToUniswap(
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
    }

    function withdraw(IERC20 token, uint256 amount) external onlyOwner {
        require(token.balanceOf(address(this)) != 0, "Invalid balance");

        token.safeTransfer(executor, amount);
    }
}
