// SPDX-License-Identifier: Apache-2.0

pragma solidity >=0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "./interfaces/IUniswapNFTManager.sol";
import "./interfaces/Balancer.sol";
import "./Executor.sol";

/**
 * @title LPController
 * @notice Contract for initial management of lp pools.
 */
contract LPController is Ownable {
    using SafeERC20 for IERC20;

    IBalancerLBPFactory public immutable balancerLBPFactory;
    IUniswapV3Factory public immutable uniswapFactory;
    IUniswapNFTManager public immutable uniswapPositionManager;
    IBalancerVault public immutable balancerVault;
    Executor public immutable daoExecutor;

    IERC20 public immutable token0;
    IERC20 public immutable token1;

    IBalancerLBP public liquidityBootstrappingPool;
    IUniswapV3Pool public uniswapPool;
    bytes32 public lbpPoolId;

    constructor(
        IBalancerLBPFactory _balancerLBPFactory,
        IUniswapV3Factory _uniswapFactory,
        IUniswapNFTManager _uniswapPositionManager,
        IBalancerVault _balancerVault,
        Executor _daoExecutor,
        IERC20 token0_,
        IERC20 token1_
    ) Ownable(msg.sender) {
        balancerLBPFactory = _balancerLBPFactory;
        uniswapPositionManager = _uniswapPositionManager;
        balancerVault = _balancerVault;
        daoExecutor = _daoExecutor;
        uniswapFactory = _uniswapFactory;

        require(token0_ < token1_, "Token0 must be less than token1");

        token0 = token0_;
        token1 = token1_;
    }

    /**
     * @notice Create lbp pool
     * @param weights - start pool's weight
     * @param endWeights - end pool's weight
     * @param initBalances - initial balances
     * @param lbpPoolDuration - duration pool working
     * @param swapFeePercentage - swapping fee in percentage
     *
     */
    function createBalancerLBP(
        uint256[] calldata weights,
        uint256[] calldata endWeights,
        uint256[] calldata initBalances,
        uint256 lbpPoolDuration,
        uint256 swapFeePercentage
    ) external onlyOwner {
        require(address(liquidityBootstrappingPool) == address(0), "LBP already exists");

        require(
            weights.length == 2 && endWeights.length == 2 && initBalances.length == 2,
            "Length for weights, endWeights and initBalances must be 2"
        );

        IBalancerVault vault = balancerVault;

        IERC20[] memory assets = new IERC20[](2);
        assets[0] = token0;
        assets[1] = token1;

        IBalancerLBP lbp = IBalancerLBP(
            balancerLBPFactory.create("Fluence LBP", "FLTLBP", assets, weights, swapFeePercentage, address(this), false)
        );
        liquidityBootstrappingPool = lbp;
        lbp.updateWeightsGradually(block.timestamp, block.timestamp + lbpPoolDuration, endWeights);

        assets[0].safeTransferFrom(msg.sender, address(this), initBalances[0]);
        assets[0].forceApprove(address(vault), initBalances[0]);

        assets[1].safeTransferFrom(msg.sender, address(this), initBalances[1]);
        assets[1].forceApprove(address(vault), initBalances[1]);

        bytes32 _lbpPoolId = lbp.getPoolId();
        IBalancerVault.JoinPoolRequest memory request = IBalancerVault.JoinPoolRequest({
            assets: assets,
            maxAmountsIn: initBalances,
            userData: abi.encode(0, initBalances),
            fromInternalBalance: false
        });
        vault.joinPool(_lbpPoolId, address(this), address(this), request);
        lbpPoolId = _lbpPoolId;
    }

    /**
     * @notice Set pool status
     *
     */
    function setSwapEnabledInBalancerLBP(bool swapEnabled) external onlyOwner {
        liquidityBootstrappingPool.setSwapEnabled(swapEnabled);
    }

    /**
     * @notice Exit from the balancer LBP
     * @param amountsOut - minimum amounts of tokens from queryExit
     */
    function exitFromBalancerLBP(uint256[] calldata amountsOut) external onlyOwner {
        IBalancerLBP lbp = liquidityBootstrappingPool;

        uint256 bptBalance = IERC20(address(lbp)).balanceOf(address(this));
        require(bptBalance > 0, "No BPT balance");

        liquidityBootstrappingPool.setSwapEnabled(false);

        IERC20(address(lbp)).approve(address(balancerVault), bptBalance);

        IERC20[] memory assets = new IERC20[](2);
        assets[0] = token0;
        assets[1] = token1;

        IBalancerVault.ExitPoolRequest memory request = IBalancerVault.ExitPoolRequest({
            assets: assets,
            minAmountsOut: amountsOut,
            userData: abi.encode(1, bptBalance),
            toInternalBalance: false
        });
        balancerVault.exitPool(lbpPoolId, address(this), payable(address(this)), request);
    }

    /**
     * @notice create uniswap liquidity pool
     * @param tickLower - the minimum derivative price of position
     * @param tickLower - the maximum derivative price of position
     * @param sqrtPriceX96 - sqrt from initial price (Q64.96 format)
     * @param swapFee - swap fee
     * @param token0Amount - amount of token0
     * @param token1Amount - amount of token1
     * @param amount0Min - minimum amount of token0
     * @param amount1Min - minimum amount of token1
     */
    function createUniswapLP(
        int24 tickLower,
        int24 tickUpper,
        uint160 sqrtPriceX96,
        uint24 swapFee,
        uint256 token0Amount,
        uint256 token1Amount,
        uint256 amount0Min,
        uint256 amount1Min
    ) external onlyOwner {
        require(address(uniswapPool) == address(0), "Uniswap pool already exists");

        require(token0Amount != 0, "Invalid amount of token0");
        require(token1Amount != 0, "Invalid amount of token1");

        address _token0 = address(token0);
        address _token1 = address(token1);

        IUniswapNFTManager positionManager = uniswapPositionManager;
        IUniswapV3Pool pool =
            IUniswapV3Pool(positionManager.createAndInitializePoolIfNecessary(_token0, _token1, swapFee, sqrtPriceX96));
        uniswapPool = pool;

        IERC20(_token0).forceApprove(address(positionManager), token0Amount);
        IERC20(_token1).forceApprove(address(positionManager), token1Amount);

        IUniswapNFTManager.MintParams memory params = IUniswapNFTManager.MintParams({
            token0: _token0,
            token1: _token1,
            fee: swapFee,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: token0Amount,
            amount1Desired: token1Amount,
            amount0Min: amount0Min,
            amount1Min: amount1Min,
            recipient: address(daoExecutor),
            deadline: block.timestamp
        });

        positionManager.mint(params);
    }

    /**
     * @notice Withdraw token from this contract to the DAO executor
     *
     */
    function withdraw(IERC20 token, uint256 amount) external onlyOwner {
        require(token.balanceOf(address(this)) != 0, "Invalid balance");

        token.safeTransfer(address(daoExecutor), amount);
    }
}
