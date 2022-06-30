import chai, { expect } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, deployments, getNamedAccounts, waffle } from "hardhat";
import { FluenceToken, LPController, VestingWithVoting, IERC20, ERC20, ERC20__factory, FluenceToken__factory } from "../typechain";
import { BigNumber, Wallet } from "ethers";
import { DAY, MONTH } from "../utils/time";
import { Config } from "../utils/config";

chai.use(waffle.solidity);

const lbpUSDAmount = 500_000;
const lbpFLTAmount = 4_000_000;

const setupTest = deployments.createFixture(
  async (
    hre: HardhatRuntimeEnvironment
  ): Promise<{
    lpController: LPController;
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
      )) as LPController
    };
  }
);

describe("LPController", () => {
  let lpController: LPController;

  before(async () => {
    const settings = await setupTest();

    lpController = settings.lpController;
  });

  it("create lbp pool", async () => {
    //TODO
  });

  it("exit from lbp", async () => {
    await lpController.exitBalancer()

    //TODO
  });

  it("create Uniswap", async () => {
    await lpController.createUniswap()
    //TODO
  });
});
