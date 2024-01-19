import chai, { expect } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, deployments, getNamedAccounts, waffle } from "hardhat";
import { FluenceToken, VestingWithVoting } from "../typechain";
import { Wallet } from "ethers";
import { MONTH } from "../utils/time";
import { Config } from "../utils/config";
import { ZERO_ADDRESS } from "../utils/consts";

chai.use(waffle.solidity);

const vestingAmount = ethers.utils.parseEther("100");
const delayDurationMonths = 3;
const vestingDurationMonths = 12;

const setupTest = deployments.createFixture(
  async (
    hre: HardhatRuntimeEnvironment
  ): Promise<{
    token: FluenceToken;
    vesting: VestingWithVoting;
  }> => {
    const hardhatSigners = await hre.ethers.getSigners();
    const fluenceMultisig = hardhatSigners[hardhatSigners.length - 1];
    Config.reset(
      {
        etherscanApiKey: "",
        repotGas: false,
        mainnet: null,
        testnet: null,
      },
      {
        token: {
          totalSupply: 1000000,
        },
      },
      fluenceMultisig.address
    );

    await hre.deployments.fixture(["FluenceToken"]);

    const { deployer, mainAccount } = await hre.getNamedAccounts();

    const tokenAddress = (await hre.deployments.get("FluenceToken")).address;
    const vesting = await hre.deployments.deploy("VestingWithVoting", {
      from: deployer,
      args: [
        tokenAddress,
        "Test Vesting With Votes",
        "TVV",
        delayDurationMonths * MONTH,
        vestingDurationMonths * MONTH,
        [mainAccount],
        [vestingAmount],
      ],
      log: true,
      autoMine: true,
      waitConfirmations: 1,
    });

    const token = (await ethers.getContractAt(
      "FluenceToken",
      tokenAddress
    )) as FluenceToken;
    await (await token.transfer(vesting.address, vestingAmount)).wait(1);

    return {
      token: token,
      vesting: (await ethers.getContractAt(
        "VestingWithVoting",
        vesting.address
      )) as VestingWithVoting,
    };
  }
);

describe("Vesting with voting", () => {
  let vesting: VestingWithVoting;
  let token: FluenceToken;
  let receiverAccount: Wallet;
  let startTime: number;

  const setTimeAfterStart = async (time: number) => {
    await ethers.provider.send("evm_setNextBlockTimestamp", [startTime + time]);
    await ethers.provider.send("evm_mine", []);
  };

  before(async () => {
    const { mainAccount } = await getNamedAccounts();
    const accounts = await waffle.provider.getWallets();
    for (let i = 0; i < accounts.length; i++) {
      if (accounts[i].address == mainAccount) {
        receiverAccount = accounts[i];
        break;
      }
    }
  });

  beforeEach(async () => {
    const settings = await setupTest();
    vesting = settings.vesting;
    token = settings.token;
    startTime = (await vesting.startTimestamp()).toNumber();

    vesting = vesting.connect(receiverAccount);
  });

  it("get votes", async () => {
    await vesting.delegate(receiverAccount.address);

    expect(await vesting.getVotes(receiverAccount.address)).to.eq(
      vestingAmount
    );
  });

  it("get votes after release", async () => {
    await vesting.delegate(receiverAccount.address);

    const time = delayDurationMonths * MONTH + 100;
    await setTimeAfterStart(time);

    const amount = await vesting.getAvailableAmount(receiverAccount.address);

    await vesting.transfer(ZERO_ADDRESS, amount);

    expect(await vesting.getVotes(receiverAccount.address)).to.eq(
      vestingAmount.sub(amount)
    );
  });
});
