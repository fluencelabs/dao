import chai, { expect } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, deployments, waffle, getNamedAccounts } from "hardhat";
import {
  LPController,
  IERC20MetadataUpgradeable,
  IERC20Metadata,
  IBalancerLBPFactory,
  IBalancerLBPFactory__factory,
  IBalancerLBP,
  IBalancerVault,
  IBalancerVault__factory,
  IUniswapV3Pool__factory,
  IBalancerLBP__factory,
  DevERC20__factory,
  IERC20Metadata__factory,
  IBalancerHelper,
  IERC20__factory,
} from "../../typechain";
import { BigNumber } from "ethers";
import { DAY } from "../../utils/time";
import { Config } from "../../utils/config";
import {
  encodeSqrtRatioX96,
  FeeAmount,
  nearestUsableTick,
  TICK_SPACINGS,
} from "@uniswap/v3-sdk";
import { IERC721__factory } from "../../typechain/factories/IERC721__factory";
import { THROW_ERROR_PREFIX } from "../../utils/consts";

chai.use(waffle.solidity);

const lbpUSDAmount = 500_000;
const lbpFLTAmount = 4_000_000;

const UNISWAP_FEE_AMOUNT: FeeAmount = 3000;

const setupTest = deployments.createFixture(
  async (
    hre: HardhatRuntimeEnvironment
  ): Promise<{
    lpController: LPController;
    fltToken: IERC20MetadataUpgradeable;
    usdToken: IERC20Metadata;
    balancerHelper: IBalancerHelper;
  }> => {
    await deployments.fixture([]);
    const hardhatSigners = await hre.ethers.getSigners();

    const token = await new DevERC20__factory(hardhatSigners[0]).deploy(
      "USD",
      "USD",
      ethers.utils.parseEther(String(lbpUSDAmount))
    );

    const fluenceMultisig = hardhatSigners[hardhatSigners.length - 1];

    Config.reset(
      {
        etherscanApiKey: "",
        repotGas: false,
        mainnet: {
          url: "",
          privateKey: "",
        },
        testnet: null,
      },
      {
        contracts: {
          usdToken: token.address,
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
            initialAmount: lbpFLTAmount,
          },
          usd: {
            weight: 0.04,
            endWeight: 0.96,
            initialAmount: lbpUSDAmount,
          },
        },
        executor: {
          delayDays: 4,
        },
      },
      fluenceMultisig.address
    );

    await hre.deployments.fixture(["FluenceToken", "Executor", "LPController"]);

    const lpControllerAddress = (await hre.deployments.get("LPController"))
      .address;

    return {
      lpController: (await ethers.getContractAt(
        "LPController",
        lpControllerAddress
      )) as LPController,
      usdToken: token,
      fltToken: (await ethers.getContractAt(
        "FluenceToken",
        (
          await hre.deployments.get("FluenceToken")
        ).address
      )) as IERC20MetadataUpgradeable,
      balancerHelper: (await ethers.getContractAt(
        "IBalancerHelper",
        "0x5aDDCCa35b7A0D07C74063c48700C8590E87864E"
      )) as IBalancerHelper,
    };
  }
);

describe("LPController", () => {
  let config: Config;
  let lpController: LPController;
  let vault: IBalancerVault;
  let lbpFactory: IBalancerLBPFactory;
  let lbp: IBalancerLBP;
  let balancerHelper: IBalancerHelper;
  let poolId: string;
  let params: Array<{
    token: IERC20MetadataUpgradeable;
    weight: BigNumber;
    endWeight: BigNumber;
    initialAmount: BigNumber;
  }>;

  before(async () => {
    const settings = await setupTest();
    const signer = ethers.provider.getSigner();

    config = Config.get();

    lpController = settings.lpController;
    vault = IBalancerVault__factory.connect(
      await settings.lpController.balancerVault(),
      signer
    );
    lbpFactory = IBalancerLBPFactory__factory.connect(
      await settings.lpController.balancerLBPFactory(),
      signer
    );
    lbp = IBalancerLBP__factory.connect(
      await settings.lpController.liquidityBootstrappingPool(),
      signer
    );
    balancerHelper = settings.balancerHelper;

    params = new Array(
      {
        token: settings.fltToken,
        weight: ethers.utils.parseEther(
          String(config.deployment!.pool!.flt.weight)
        ),
        endWeight: ethers.utils.parseEther(
          String(config.deployment!.pool!.flt.endWeight)
        ),
        initialAmount: ethers.utils.parseEther(
          String(config.deployment!.pool!.flt.initialAmount)
        ),
      },
      {
        token: settings.usdToken,
        weight: ethers.utils.parseEther(
          String(config.deployment!.pool!.usd.weight)
        ),
        endWeight: ethers.utils.parseEther(
          String(config.deployment!.pool!.usd.endWeight)
        ),
        initialAmount: ethers.utils.parseUnits(
          String(config.deployment!.pool!.usd.initialAmount),
          Number(await settings.usdToken.decimals())
        ),
      }
    );
    params = params.sort((a, b) =>
      BigNumber.from(a.token.address).gt(BigNumber.from(b.token.address))
        ? 1
        : -1
    );

    poolId = await lpController.lbpPoolId();
  });

  it("create lbp pool", async () => {
    const fromBlock = (
      await ethers.provider.getTransactionReceipt(
        (
          await deployments.get("LPController")
        ).transactionHash!
      )
    ).blockNumber;

    const log = (
      await ethers.provider.getLogs({
        fromBlock: fromBlock,
        toBlock: "latest",
        address: lbpFactory.address,
        topics: lbpFactory.filters.PoolCreated().topics,
      })
    )[0];
    const block = await ethers.provider.getBlock(log.blockHash);

    const lbpPoolDurationDays =
      config.deployment!.pool!.lbpPoolDurationDays * DAY;

    expect(await lbp.getSwapEnabled()).to.eq(false);
    expect(await lbp.getSwapFeePercentage()).to.eq(
      ethers.utils.parseUnits(
        String(config.deployment!.pool!.swapFeePercentage),
        16
      )
    );
    expect(await lbp.getNormalizedWeights()).to.deep.eq([
      BigNumber.from("40012704793395452"),
      BigNumber.from("960002554461334543"),
    ]);

    const gwuParams = await lbp.getGradualWeightUpdateParams();
    expect(gwuParams.startTime).to.eq(BigNumber.from(block.timestamp));
    expect(gwuParams.endTime).to.eq(
      BigNumber.from(block.timestamp + lbpPoolDurationDays)
    );
    expect(gwuParams.endWeights).to.deep.eq([
      BigNumber.from("960006103608758679"),
      BigNumber.from("40009155413138018"),
    ]);

    expect(await params[0].token.balanceOf(lpController.address)).to.eq(
      BigNumber.from(0)
    );
    expect(await params[1].token.balanceOf(lpController.address)).to.eq(
      BigNumber.from(0)
    );

    const poolTokens = await vault.getPoolTokens(poolId);
    expect(poolTokens.tokens).to.deep.eq(params.map((x) => x.token.address));
    expect(poolTokens.balances).to.deep.eq(params.map((x) => x.initialAmount));

    expect(
      await IERC20Metadata__factory.connect(
        lbp.address,
        ethers.provider.getSigner()
      ).balanceOf(lpController.address)
    ).to.eq(BigNumber.from("7363068856696822977659896"));
  });

  it("setSwapEnabledInBalancerLBP", async () => {
    await lpController.setSwapEnabledInBalancerLBP(true);
    expect(await lbp.getSwapEnabled()).to.eq(true);

    await lpController.setSwapEnabledInBalancerLBP(false);
    expect(await lbp.getSwapEnabled()).to.eq(false);
  });

  it("exit from lbp", async () => {
    const userData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint256"],
      [
        1,
        await IERC20__factory.connect(
          await lpController.liquidityBootstrappingPool(),
          await ethers.provider.getSigner()
        ).balanceOf(lpController.address),
      ]
    );

    const queryExitRes = await balancerHelper.callStatic.queryExit(
      await lpController.lbpPoolId(),
      lpController.address,
      lpController.address,
      {
        assets: [await lpController.token0(), await lpController.token1()],
        minAmountsOut: new Array(2).fill(0),
        userData: userData,
        toInternalBalance: false,
      }
    );

    const tx = await lpController.exitFromBalancerLBP(queryExitRes[1]);
    await tx.wait();
    expect(
      await IERC20Metadata__factory.connect(
        lbp.address,
        ethers.provider.getSigner()
      ).balanceOf(lpController.address)
    ).to.eq(BigNumber.from("0"));
    expect(await params[0].token.balanceOf(lpController.address)).to.eq(
      BigNumber.from("499999999999999999500000")
    );
    expect(await params[1].token.balanceOf(lpController.address)).to.eq(
      BigNumber.from("3999999999999999996000000")
    );
    expect(await lbp.getSwapEnabled()).to.eq(false);
  });

  it("withdraw", async () => {
    const executor = await lpController.daoExecutor();

    const v = BigNumber.from(1000000);
    const snapshotBalance = await params[0].token.balanceOf(executor);
    await expect(await lpController.withdraw(params[0].token.address, v))
      .to.emit(params[0].token, "Transfer")
      .withArgs(lpController.address, executor, v);

    expect(await params[0].token.balanceOf(executor)).to.eq(
      snapshotBalance.add(v)
    );
  });

  it("create Uniswap", async () => {
    const token0Balance = await params[0].token.balanceOf(lpController.address);
    const token1Balance = await await params[1].token.balanceOf(
      lpController.address
    );

    const price = encodeSqrtRatioX96(
      token1Balance.toString(),
      token0Balance.toString()
    );

    const spacings = TICK_SPACINGS[UNISWAP_FEE_AMOUNT];

    const nonfungiblePositionManager = IERC721__factory.connect(
      await lpController.uniswapPositionManager(),
      ethers.provider
    );
    await lpController.createUniswapLP(
      nearestUsableTick(-887272, spacings),
      nearestUsableTick(887272, spacings),
      price.toString(),
      3000,
      token0Balance,
      token1Balance,
      0,
      0
    );

    const pool = await lpController.uniswapPool();

    expect(
      await nonfungiblePositionManager.balanceOf(
        await lpController.daoExecutor()
      )
    ).to.eq(1);

    const tokenOneExpected = BigNumber.from("499999999999999998432742");
    expect(await params[0].token.balanceOf(pool)).to.eq(tokenOneExpected);
    expect(await params[1].token.balanceOf(pool)).to.eq(token1Balance);

    expect(await params[0].token.balanceOf(lpController.address)).to.eq(
      token0Balance.sub(tokenOneExpected)
    );
    expect(await params[1].token.balanceOf(lpController.address)).to.eq(
      BigNumber.from(0)
    );

    const poolContract = IUniswapV3Pool__factory.connect(pool, ethers.provider);

    const slot0 = await poolContract.slot0();
    expect(slot0.sqrtPriceX96.toString()).to.eq(price.toString());

    // TODO: ticker lower
    // TODO: ticker upper
  });

  it("test method access", async () => {
    const { mainAccount } = await getNamedAccounts();
    const lpControllerWithMainAccount = lpController.connect(
      ethers.provider.getSigner(mainAccount)
    );

    await expect(
      lpControllerWithMainAccount.createBalancerLBP(
        [BigNumber.from(1)],
        [BigNumber.from(1)],
        [BigNumber.from(1)],
        BigNumber.from(1),
        BigNumber.from(1)
      )
    ).to.be.revertedWith(
      'OwnableUnauthorizedAccount("0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65")'
    );

    await expect(
      lpControllerWithMainAccount.setSwapEnabledInBalancerLBP(false)
    ).to.be.revertedWith(
      `OwnableUnauthorizedAccount("0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65")`
    );

    await expect(
      lpControllerWithMainAccount.exitFromBalancerLBP([0, 0])
    ).to.be.revertedWith(
      `OwnableUnauthorizedAccount("0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65")`
    );

    await expect(
      lpControllerWithMainAccount.createUniswapLP(
        BigNumber.from(1),
        BigNumber.from(1),
        BigNumber.from(1),
        BigNumber.from(1),
        BigNumber.from(1),
        BigNumber.from(1),
        BigNumber.from(1),
        BigNumber.from(1)
      )
    ).to.be.revertedWith(
      `OwnableUnauthorizedAccount("0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65")`
    );

    await expect(
      lpControllerWithMainAccount.withdraw(
        params[0].token.address,
        BigNumber.from(1000)
      )
    ).to.be.revertedWith(
      `OwnableUnauthorizedAccount("0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65")`
    );
  });
});
