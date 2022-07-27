import chai, { expect } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, deployments, waffle, getNamedAccounts } from "hardhat";
import { LPController, FluenceToken__factory, IERC20Metadata, ILiquidityBootstrappingPoolFactory, ILiquidityBootstrappingPoolFactory__factory, ILiquidityBootstrappingPool, ILiquidityBootstrappingPool__factory, IBalancerVault, IBalancerVault__factory, IERC20__factory, IERC20Metadata__factory } from "../typechain";
import { BigNumber } from "ethers";
import { DAY } from "../utils/time";
import { Config } from "../utils/config";
import exp from "constants";

chai.use(waffle.solidity);

const lbpUSDAmount = 500_000;
const lbpFLTAmount = 4_000_000;

const setupTest = deployments.createFixture(
  async (
    hre: HardhatRuntimeEnvironment
  ): Promise<{
    lpController: LPController;
    fltToken: IERC20Metadata;
    usdToken: IERC20Metadata;
  }> => {
    await deployments.fixture([]);

    const token = await new FluenceToken__factory((await ethers.getSigners())[0]).deploy("USD", "USD", ethers.utils.parseEther(String(lbpUSDAmount)));

    Config.reset({
      etherscanApiKey: "",
      repotGas: false,
      mainnet: {
        url: "",
        privateKey: ""
      },
      testnet: null,
    }, {
      contracts: {
        usdToken: token.address
      },
      token: {
        totalSupply: lbpFLTAmount,
      },
      pool: {
        lbpPoolDurationDays: 3,
        swapFeePercentage: 1,
        flt: {
          weight: 0.96,
          endWeight: 0.04,
          initialAmount: lbpFLTAmount
        },
        usd: {
          weight: 0.04,
          endWeight: 0.96,
          initialAmount: lbpUSDAmount,
        }
      },
      executor: {
        delayDays: 4
      }
    });

    await hre.deployments.fixture(["FluenceToken", "Executor", "LPController"]);

    const lpControllerAddress = (await hre.deployments.get("LPController")).address;

    return {
      lpController: (await ethers.getContractAt(
        "LPController",
        lpControllerAddress
      )) as LPController,
      usdToken: token,
      fltToken: (await ethers.getContractAt(
        "FluenceToken",
        (await hre.deployments.get("FluenceToken")).address
      )) as IERC20Metadata,
    };
  }
);

describe("LPController", () => {
  let config: Config;
  let lpController: LPController;
  let vault: IBalancerVault;
  let lbpFactory: ILiquidityBootstrappingPoolFactory;
  let lbp: ILiquidityBootstrappingPool;
  let poolId: string;
  let params: Array<{
    token: IERC20Metadata,
    weight: BigNumber,
    endWeight: BigNumber,
    initialAmount: BigNumber
  }>;

  before(async () => {
    const settings = await setupTest();
    const signer = ethers.provider.getSigner();

    config = Config.get();

    lpController = settings.lpController;
    vault = IBalancerVault__factory.connect(await settings.lpController.balancerVault(), signer)
    lbpFactory = ILiquidityBootstrappingPoolFactory__factory.connect(await settings.lpController.balancerLBPFactory(), signer)
    lbp = ILiquidityBootstrappingPool__factory.connect(await settings.lpController.liquidityBootstrappingPool(), signer)

    params = new Array(
      {
        token: settings.fltToken,
        weight: ethers.utils.parseEther(String(config.deployment!.pool!.flt.weight)),
        endWeight: ethers.utils.parseEther(String(config.deployment!.pool!.flt.endWeight)),
        initialAmount: ethers.utils.parseEther(String(config.deployment!.pool!.flt.initialAmount))
      },
      {
        token: settings.usdToken,
        weight: ethers.utils.parseEther(String(config.deployment!.pool!.usd.weight)),
        endWeight: ethers.utils.parseEther(String(config.deployment!.pool!.usd.endWeight)),
        initialAmount: ethers.utils.parseUnits(String(config.deployment!.pool!.usd.initialAmount), Number(await settings.usdToken.decimals()))
      }
    );
    params = params.sort((a, b) => BigNumber.from(a.token.address).gt(BigNumber.from(b.token.address)) ? 1 : -1);

    poolId = await lpController.lbpPoolId();
  });

  it("create lbp pool", async () => {
    const fromBlock =
      (await ethers.provider.getTransactionReceipt((await deployments.get("LPController")).transactionHash!)).blockNumber;

    const log = (await ethers.provider.getLogs({
      fromBlock: fromBlock,
      toBlock: "latest",
      address: lpController.address,
      topics: lpController.filters.CreateBalancerLBP().topics
    }))[0];

    const txHash = log.transactionHash
    const block = await ethers.provider.getBlock(log.blockHash)

    const lbpPoolDurationDays = config.deployment!.pool!.lbpPoolDurationDays * DAY

    expect(await lbp.getSwapEnabled()).to.eq(true)
    expect(await lbp.getSwapFeePercentage()).to.eq(ethers.utils.parseUnits(String(config.deployment!.pool!.swapFeePercentage), 16))
    expect(await lbp.getNormalizedWeights()).to.deep.eq([
      BigNumber.from('40012704793395452'),
      BigNumber.from('960002554461334543'),
    ])

    const gwuParams = await lbp.getGradualWeightUpdateParams()
    expect(gwuParams.startTime).to.eq(BigNumber.from(block.timestamp))
    expect(gwuParams.endTime).to.eq(BigNumber.from(block.timestamp + lbpPoolDurationDays))
    expect(gwuParams.endWeights).to.deep.eq([
      BigNumber.from('960006103608758679'),
      BigNumber.from('40009155413138018'),
    ])

    expect(await params[0].token.balanceOf(lpController.address)).to.eq(BigNumber.from(0));
    expect(await params[1].token.balanceOf(lpController.address)).to.eq(BigNumber.from(0));

    const poolTokens = await vault.getPoolTokens(poolId)
    expect(poolTokens.tokens).to.deep.eq(params.map(x => x.token.address))
    expect(poolTokens.balances).to.deep.eq(params.map(x => x.initialAmount))

    expect(
      await IERC20Metadata__factory.connect(lbp.address, ethers.provider.getSigner())
        .balanceOf(lpController.address)
    ).to.eq(BigNumber.from("7363068856696822977659896"))

    await expect(txHash).to.emit(lpController, "CreateBalancerLBP").withArgs(
      lbp.address,
      params.map(x => x.weight),
      params.map(x => x.endWeight),
      params.map(x => x.initialAmount),
      lbpPoolDurationDays,
      ethers.utils.parseUnits(String(config.deployment!.pool!.swapFeePercentage), 16)
    )
  }
  );

  it("exit from lbp", async () => {
    const tx = await lpController.exitFromBalancerLBP();
    await tx.wait();
    expect(
      await IERC20Metadata__factory.connect(lbp.address, ethers.provider.getSigner())
        .balanceOf(lpController.address)
    ).to.eq(BigNumber.from("0"))
    expect(await params[0].token.balanceOf(lpController.address)).to.eq(BigNumber.from('499999999999999999500000'));
    expect(await params[1].token.balanceOf(lpController.address)).to.eq(BigNumber.from('3999999999999999996000000'));
    expect(await lbp.getSwapEnabled()).to.eq(false)
  });

  it("create Uniswap", async () => {
    /*
    await expect(await lpController.createUniswapLP())
      await expect(txHash).to.emit(lpController, "CreateUniswapLP")
      await expect(txHash).to.emit(lpController.uniswapFactory(), "PoolCreated")
    */
    //TODO: check event args
  });
});
