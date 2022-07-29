// SPDX-License-Identifier: Apache-2.0

pragma solidity >=0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "./IUniswapNFTManager.sol";
import "./Balancer.sol";

contract LPController is Ownable {
    using SafeERC20 for IERC20;

    uint24 public constant UNISWAP_FEE = 3000;

    ILiquidityBootstrappingPoolFactory public immutable balancerLBPFactory;
    IUniswapV3Factory public immutable uniswapFactory;
    IUniswapNFTManager public immutable nonfungiblePositionManager;
    IBalancerVault public immutable balancerVault;
    IBalancerHelper public immutable balancerHelper;

    IERC20 public immutable token0;
    IERC20 public immutable token1;

    address public immutable executor;

    ILiquidityBootstrappingPool public liquidityBootstrappingPool;
    IUniswapV3Pool public uniswapPool;
    bytes32 public lbpPoolId;

    constructor(
        ILiquidityBootstrappingPoolFactory _balancerLBPFactory,
        IUniswapV3Factory _uniswapFactory,
        IUniswapNFTManager _nonfungiblePositionManager,
        IBalancerVault _balancerVault,
        IBalancerHelper _balancerHelper,
        address _executor,
        IERC20 token0_,
        IERC20 token1_
    ) {
        balancerLBPFactory = _balancerLBPFactory;
        nonfungiblePositionManager = _nonfungiblePositionManager;
        balancerVault = _balancerVault;
        balancerHelper = _balancerHelper;
        executor = _executor;
        uniswapFactory = _uniswapFactory;

        require(token0_ < token1_, "Token0 must be less than token1");

        token0 = token0_;
        token1 = token1_;
    }

    function createBalancerLBP(
        uint256[] calldata weights,
        uint256[] calldata endWeights,
        uint256[] calldata initBalances,
        uint256 lbpPoolDuration,
        uint256 swapFeePercentage
    ) external onlyOwner {
        require(
            address(liquidityBootstrappingPool) == address(0),
            "LBP already exists"
        );

        require(
            weights.length == 2 ||
                endWeights.length == 2 ||
                initBalances.length == 2,
            "Length for weights, endWeights and initBalances must be 2"
        );

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
                true
            )
        );

        bytes32 _lbpPoolId = lbp.getPoolId();

        lbp.updateWeightsGradually(
            block.timestamp,
            block.timestamp + lbpPoolDuration,
            endWeights
        );

        token0.transferFrom(msg.sender, address(this), initBalances[0]);
        token0.safeApprove(address(balancerVault), initBalances[0]);

        token1.transferFrom(msg.sender, address(this), initBalances[1]);
        token1.safeApprove(address(balancerVault), initBalances[1]);

        IBalancerVault.JoinPoolRequest memory request = IBalancerVault
            .JoinPoolRequest({
                assets: assets,
                maxAmountsIn: initBalances,
                userData: abi.encode(0, initBalances),
                fromInternalBalance: false
            });

        balancerVault.joinPool(
            _lbpPoolId,
            address(this),
            address(this),
            request
        );

        lbpPoolId = _lbpPoolId;
        liquidityBootstrappingPool = lbp;
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
                userData: abi.encode(1, bptBalance),
                toInternalBalance: false
            });

        (, uint256[] memory amountsOut) = balancerHelper.queryExit(
            lbpPoolId,
            address(this),
            address(this),
            request
        );

        request.minAmountsOut = amountsOut;

        balancerVault.exitPool(
            lbpPoolId,
            address(this),
            payable(address(this)),
            request
        );

        liquidityBootstrappingPool.setSwapEnabled(false);
    }

    function createUniswapLP(
        int24 tickLower,
        int24 tickUpper,
        uint160 sqrtPriceX96
    ) external onlyOwner {
        require(
            address(uniswapPool) == address(0),
            "Uniswap pool already exists"
        );

        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));

        require(balance0 != 0, "Invalid balance of token0");
        require(balance1 != 0, "Invalid balance of token1");

        IUniswapV3Pool pool = IUniswapV3Pool(
            uniswapFactory.createPool(
                address(token0),
                address(token1),
                UNISWAP_FEE
            )
        );

        pool.initialize(sqrtPriceX96);

        token0.safeApprove(address(nonfungiblePositionManager), balance0);
        token1.safeApprove(address(nonfungiblePositionManager), balance1);

        IUniswapNFTManager.MintParams memory params = IUniswapNFTManager
            .MintParams({
                token0: address(token0),
                token1: address(token1),
                fee: UNISWAP_FEE,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: balance0,
                amount1Desired: balance1,
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(executor),
                deadline: block.timestamp
            });

        nonfungiblePositionManager.mint(params);

        uniswapPool = pool;
    }

    function withdraw(IERC20 token, uint256 amount) external onlyOwner {
        require(token.balanceOf(address(this)) != 0, "Invalid balance");

        token.safeTransfer(executor, amount);
    }
}
