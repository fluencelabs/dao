import chai, { expect } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, deployments, waffle } from "hardhat";
import { LPController, FluenceToken__factory, IERC20Metadata, ILiquidityBootstrappingPoolFactory, ILiquidityBootstrappingPoolFactory__factory, ILiquidityBootstrappingPool, ILiquidityBootstrappingPool__factory, IBalancerVault, IBalancerVault__factory } from "../typechain";
import { BigNumber } from "ethers";
import { DAY } from "../utils/time";
import { Config } from "../utils/config";
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
    const { deployer } = await hre.getNamedAccounts();

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
  let fltToken: IERC20Metadata;
  let usdToken: IERC20Metadata;
  let config: Config;

  let lpController: LPController;

  before(async () => {
    const settings = await setupTest();

    lpController = settings.lpController;
    fltToken = settings.fltToken;
    usdToken = settings.usdToken;

    config = Config.get();
  });

  it("create lbp pool", async () => {
    let params = new Array(
      {
        token: fltToken.address,
        weight: ethers.utils.parseEther(String(config.deployment!.pool!.flt.weight)),
        endWeight: ethers.utils.parseEther(String(config.deployment!.pool!.flt.endWeight)),
        initialAmount: ethers.utils.parseEther(String(config.deployment!.pool!.flt.initialAmount))
      },
      {
        token: usdToken.address,
        weight: ethers.utils.parseEther(String(config.deployment!.pool!.usd.weight)),
        endWeight: ethers.utils.parseEther(String(config.deployment!.pool!.usd.endWeight)),
        initialAmount: ethers.utils.parseUnits(String(config.deployment!.pool!.usd.initialAmount), Number(await usdToken.decimals()))
      }
    );

    params = params.sort((a, b) => BigNumber.from(a.token).gt(BigNumber.from(b.token)) ? 1 : -1);

    const b =
      (await ethers.provider.getTransactionReceipt((await deployments.get("LPController")).transactionHash!)).blockNumber;

    const log = (await ethers.provider.getLogs({
      fromBlock: b,
      toBlock: "latest",
      address: lpController.address,
      topics: lpController.filters.CreateBalancerLBP().topics
    }))[0];

    const parsedLog = lpController.interface.parseLog(log);

    expect(parsedLog.name, "CreateBalancerLBP");
    expect(parsedLog.args.lbp).to.eq(await lpController.liquidityBootstrappingPool())
    expect(parsedLog.args.weights).to.deep.eq(params.map(x => x.weight))
    expect(parsedLog.args.endWeights).to.deep.eq(params.map(x => x.endWeight))
    expect(parsedLog.args.initBalances).to.deep.eq(params.map(x => x.initialAmount))
    expect(parsedLog.args.lbpPoolDuration).to.eq(config.deployment!.pool!.lbpPoolDurationDays * DAY)
    expect(parsedLog.args.swapFeePercentage).to.eq(ethers.utils.parseUnits(String(config.deployment!.pool!.swapFeePercentage), 16))

    const lbpFactoryinterface = ILiquidityBootstrappingPoolFactory__factory.createInterface();

    const factoryLogs = await ethers.provider.getLogs({
      fromBlock: b,
      toBlock: "latest",
      address: await lpController.balancerLBPFactory(),
      topics: [lbpFactoryinterface.getEventTopic(lbpFactoryinterface.events["PoolCreated(address)"])]
    });
    const poolCreatedLog = lbpFactoryinterface.parseLog(factoryLogs[0]);
    expect(poolCreatedLog.name, "PoolCreated");
    expect(poolCreatedLog.args.pool).to.eq(await lpController.liquidityBootstrappingPool())


    const poolLogs = await ethers.provider.getLogs({
      fromBlock: b,
      toBlock: "latest",
      address: await lpController.liquidityBootstrappingPool()
    });

    const lbpInterface = ILiquidityBootstrappingPool__factory.createInterface();

    const swapFeePercentageChanged = lbpInterface.parseLog(poolLogs[0]);
    expect(swapFeePercentageChanged.name, "SwapFeePercentageChanged");

    const gradualWeightUpdateScheduled = lbpInterface.parseLog(poolLogs[1]);
    expect(gradualWeightUpdateScheduled.name, "GradualWeightUpdateScheduled");

    const swapEnabledSetTwo = lbpInterface.parseLog(poolLogs[2]);
    expect(swapEnabledSetTwo.name, "SwapEnabledSet");

    const vaultLog = await ethers.provider.getLogs({
      fromBlock: b,
      toBlock: "latest",
      address: await lpController.balancerVault()
    });

    const vaultInterface = IBalancerVault__factory.createInterface();

    const poolRegistered = vaultInterface.parseLog(vaultLog[0]);
    expect(poolRegistered.name, "PoolRegistered");

    const tokensRegistered = vaultInterface.parseLog(vaultLog[1]);
    expect(tokensRegistered.name, "TokensRegistered");

    const poolBalanceChanged = vaultInterface.parseLog(vaultLog[2]);
    expect(poolBalanceChanged.name, "PoolBalanceChanged");

    //TODO: check event args
  });

  it("exit from lbp", async () => {
    /*await expect(await lpController.exitFromBalancerLBP())
      .to.emit(lpController, "ExitFromBalancerLBP")
      .to.emit(lpController.balancerVault(), "PoolBalanceChanged")
*/
    //TODO: check event args
  });

  it("create Uniswap", async () => {
    /*
    await expect(await lpController.createUniswapLP())
      .to.emit(lpController, "CreateUniswapLP")
      .to.emit(lpController.uniswapFactory(), "PoolCreated")
    */
    //TODO: check event args
  });
});
