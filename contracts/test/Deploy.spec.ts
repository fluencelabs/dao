import chai, { expect } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, deployments, getNamedAccounts, waffle } from "hardhat";
import { Executor, FluenceToken, VestingWithVoting, DevRewardDistributor, Governor, Vesting } from "../typechain";
import { Config } from "../utils/config";

chai.use(waffle.solidity);

const vestingAmount = ethers.utils.parseEther("100");
const cliffDurationMonths = 3;
const vestingDurationMonths = 12;


describe("Deploy script", () => {
  let token: FluenceToken;
  let executor: Executor;
  let devRewardDistributor: DevRewardDistributor;
  let investorsVesting: Vesting;
  let fluenceVesting: Vesting;
  let teamVesting: VestingWithVoting;
  let governor: Governor;

  let config: Config;
  before(async () => {
    Config.reset({
      etherscanApiKey: "",
      repotGas: false,
      mainnet: null,
      testnet: null,
    }, {
      token: {
        totalSupply: 1000000,
      },
      executor: {
        delayDays: 4
      },
      devRewardDistributor: {
        merkleRoot: "0x1000000000000000000000000000000000000000000000000000000000000001",
        initialReward: 1,
        totalRewards: 100,
        halvePeriodMonths: 3,
        claimingPeriodMonths: 5
      },
      fluenceVesting: {
        cliffDurationMonths: 2,
        vestingDurationMonths: 3,
        account: "0x0000000000000000000000000000000000000001",
        amount: 1
      },
      investorsVesting: {
        cliffDurationMonths: 2,
        vestingDurationMonths: 3,
        accounts: ["0x0000000000000000000000000000000000000002", "0x0000000000000000000000000000000000000003"],
        amounts: [2, 3]
      },
      teamVesting: {
        cliffDurationMonths: 2,
        vestingDurationMonths: 3,
        accounts: ["0x0000000000000000000000000000000000000003", "0x0000000000000000000000000000000000000004"],
        amounts: [3, 4]
      },
      governor: {
        votingDelayDays: 5,
        votingPeriodDays: 7,
        proposalThreshold: 12
      }
    });

    config = Config.get();

    await deployments.fixture();

    token = (await ethers.getContractAt(
      "FluenceToken",
      (await deployments.get("FluenceToken")).address
    )) as FluenceToken;

    executor = (await ethers.getContractAt(
      "Executor",
      (await deployments.get("Executor")).address
    )) as Executor;

    devRewardDistributor = (await ethers.getContractAt(
      "DevRewardDistributor",
      (await deployments.get("DevRewardDistributor")).address
    )) as DevRewardDistributor;

    investorsVesting = (await ethers.getContractAt(
      "Vesting",
      (await deployments.get("InvestorsVesting")).address
    )) as Vesting;

    fluenceVesting = (await ethers.getContractAt(
      "Vesting",
      (await deployments.get("FluenceVesting")).address
    )) as Vesting;

    teamVesting = (await ethers.getContractAt(
      "VestingWithVoting",
      (await deployments.get("TeamVesting")).address
    )) as VestingWithVoting;

    governor = (await ethers.getContractAt(
      "Governor",
      (await deployments.get("Governor")).address
    )) as Governor;
  });

  it("token is correct", async () => {
    expect(
      await token.name()
    ).to.eq("Fluence Token");

    expect(
      await token.symbol()
    ).to.eq("FLT");

    expect(
      await token.totalSupply()
    ).to.eq(ethers.utils.parseEther(String(config.deployment!.token!.totalSupply)));
  });

  it("token balances is correct", async () => {
    expect(
      await token.balanceOf(devRewardDistributor.address)
    ).to.eq(ethers.utils.parseEther(String(config.deployment!.devRewardDistributor!.totalRewards)));

    expect(
      await token.balanceOf(investorsVesting.address)
    ).to.eq(ethers.utils.parseEther(String(config.deployment!.investorsVesting!.amounts.reduce((acc, cur) => acc + cur, 0))));

    expect(
      await token.balanceOf(fluenceVesting.address)
    ).to.eq(ethers.utils.parseEther(String(config.deployment!.fluenceVesting!.amount)));

    expect(
      await token.balanceOf(teamVesting.address)
    ).to.eq(ethers.utils.parseEther(String(config.deployment!.teamVesting!.amounts.reduce((acc, cur) => acc + cur, 0))));

  });

  it("executor is correct", async () => {

  });

  it("DevRewardDistributor is correct", async () => {

  });

  it("InvestorVesting is correct", async () => {

  });

  it("FluenceVesting is correct", async () => {

  });

  it("TeamVesting is correct", async () => {

  });

  it("Governor is correct", async () => {

  });
});
