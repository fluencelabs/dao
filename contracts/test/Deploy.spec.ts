import chai, { expect } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, deployments, getNamedAccounts, waffle } from "hardhat";
import { Executor, FluenceToken, VestingWithVoting, DevRewardDistributor, Governor, Vesting, LPController, FluenceToken__factory, IERC20, IERC20Metadata } from "../typechain";
import { Config } from "../utils/config";
import { DAY, MONTH } from "../utils/time";
import { BigNumber } from "ethers";

chai.use(waffle.solidity);
const PROPOSER_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("PROPOSER_ROLE")
);
const TIMELOCK_ADMIN_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("TIMELOCK_ADMIN_ROLE")
);
const CANCELLER_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("CANCELLER_ROLE")
);
const EXECUTOR_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("EXECUTOR_ROLE")
);

const lbpUSDAmount = 500_000;
const lbpFLTAmount = 100_000;

describe("Deploy script", () => {
  let token: FluenceToken;
  let usdToken: IERC20Metadata;
  let executor: Executor;
  let lpController: LPController;
  let devRewardDistributor: DevRewardDistributor;
  let investorsVesting: Vesting;
  let fluenceVesting: Vesting;
  let teamVesting: VestingWithVoting;
  let governor: Governor;

  let config: Config;

  const setupTest = deployments.createFixture(
    async (
      hre: HardhatRuntimeEnvironment
    ) => {

      usdToken = await new FluenceToken__factory((await ethers.getSigners())[0]).deploy("USD", "USD", ethers.utils.parseEther(String(lbpUSDAmount)));

      Config.reset({
        etherscanApiKey: "",
        repotGas: false,
        mainnet: null,
        testnet: null,
      }, {
        contracts: {
          usdToken: usdToken.address
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
        token: {
          totalSupply: 10_000_000,
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

      await deployments.fixture([]);
      await deployments.fixture();

      token = (await ethers.getContractAt(
        "FluenceToken",
        (await deployments.get("FluenceToken")).address
      )) as FluenceToken;

      executor = (await ethers.getContractAt(
        "Executor",
        (await deployments.get("Executor")).address
      )) as Executor;

      lpController = (await ethers.getContractAt(
        "LPController",
        (await deployments.get("LPController")).address
      )) as LPController;

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
    }
  );

  before(async () => {
    await setupTest()
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

  it("token balances are correct", async () => {
    const devRewardBalance = await token.balanceOf(devRewardDistributor.address);
    const investorsVestingBalance = await token.balanceOf(investorsVesting.address);
    const fluenceVestingBalance = await token.balanceOf(fluenceVesting.address);
    const teamVestingBalance = await token.balanceOf(teamVesting.address);

    expect(
      devRewardBalance,
    ).to.eq(ethers.utils.parseEther(String(config.deployment!.devRewardDistributor!.totalRewards)));

    expect(
      investorsVestingBalance,
    ).to.eq(ethers.utils.parseEther(String(config.deployment!.investorsVesting!.amounts.reduce((acc, cur) => acc + cur, 0))));

    expect(
      fluenceVestingBalance,
    ).to.eq(ethers.utils.parseEther(String(config.deployment!.fluenceVesting!.amount)));

    expect(
      teamVestingBalance,
    ).to.eq(ethers.utils.parseEther(String(config.deployment!.teamVesting!.amounts.reduce((acc, cur) => acc + cur, 0))));

    expect(
      await token.balanceOf(executor.address)
    ).to.eq(
      ethers.utils.parseEther(String(config.deployment!.token!.totalSupply)).sub(
        BigNumber.from(0)
          .add(devRewardBalance)
          .add(investorsVestingBalance)
          .add(fluenceVestingBalance)
          .add(teamVestingBalance)
          .add(ethers.utils.parseEther(String(config.deployment!.pool!.flt!.initialAmount)))
      )
    );

    expect(
      await token.balanceOf(governor.address)
    ).to.eq(0);

    //TODO: veify balancer 
  });

  it("executor is correct", async () => {
    const { deployer } = await getNamedAccounts()

    expect(await executor.getMinDelay()).to.eq(config.deployment!.executor!.delayDays * DAY);

    expect(await executor.hasRole(TIMELOCK_ADMIN_ROLE, deployer)).to.eq(false);
    expect(await executor.hasRole(TIMELOCK_ADMIN_ROLE, executor.address)).to.eq(true);

    expect(await executor.hasRole(PROPOSER_ROLE, deployer)).to.eq(false);
    expect(await executor.hasRole(CANCELLER_ROLE, deployer)).to.eq(false);
    expect(await executor.hasRole(EXECUTOR_ROLE, deployer)).to.eq(false);

    expect(await executor.hasRole(PROPOSER_ROLE, governor.address)).to.eq(true);
    expect(await executor.hasRole(CANCELLER_ROLE, governor.address)).to.eq(true);
    expect(await executor.hasRole(EXECUTOR_ROLE, "0x0000000000000000000000000000000000000000")).to.eq(true);
  });

  it("DevRewardDistributor is correct", async () => {
    expect(await devRewardDistributor.token()).to.eq(token.address);
    expect(await devRewardDistributor.executor()).to.eq(executor.address);
    expect(await devRewardDistributor.merkleRoot()).to.eq(config.deployment!.devRewardDistributor!.merkleRoot);
    expect(await devRewardDistributor.halvePeriod()).to.eq(config.deployment!.devRewardDistributor!.halvePeriodMonths * MONTH);
    expect(await devRewardDistributor.initialReward()).to.eq(ethers.utils.parseEther(String(config.deployment!.devRewardDistributor!.initialReward)));
    expect(await devRewardDistributor.claimingPeriod()).to.eq(config.deployment!.devRewardDistributor!.claimingPeriodMonths * MONTH);
  });

  it("InvestorVesting is correct", async () => {
    expect(await investorsVesting.token()).to.eq(token.address);
    expect(await investorsVesting.cliffDurationMonths()).to.eq(config.deployment!.investorsVesting!.cliffDurationMonths);
    expect(await investorsVesting.vestingDurationMonths()).to.eq(config.deployment!.investorsVesting!.vestingDurationMonths);

    const accounts = config.deployment!.investorsVesting!.accounts;
    const amounts = config.deployment!.investorsVesting!.amounts;
    for (let i = 0; i < accounts.length; i++) {
      const account = await investorsVesting.vestingInfo(accounts[i]);
      expect(account.locked).to.eq(ethers.utils.parseEther(String(amounts[i])));
      expect(account.released).to.eq(0);
    }
  });

  it("FluenceVesting is correct", async () => {
    expect(await fluenceVesting.token()).to.eq(token.address);
    expect(await fluenceVesting.cliffDurationMonths()).to.eq(config.deployment!.fluenceVesting!.cliffDurationMonths);
    expect(await fluenceVesting.vestingDurationMonths()).to.eq(config.deployment!.fluenceVesting!.vestingDurationMonths);

    const account = await fluenceVesting.vestingInfo(config.deployment!.fluenceVesting!.account);
    expect(account.locked).to.eq(ethers.utils.parseEther(String(config.deployment!.fluenceVesting!.amount)));
    expect(account.released).to.eq(0);
  });

  it("TeamVesting is correct", async () => {
    expect(await teamVesting.token()).to.eq(token.address);
    expect(await teamVesting.cliffDurationMonths()).to.eq(config.deployment!.teamVesting!.cliffDurationMonths);
    expect(await teamVesting.vestingDurationMonths()).to.eq(config.deployment!.teamVesting!.vestingDurationMonths);

    const accounts = config.deployment!.teamVesting!.accounts;
    const amounts = config.deployment!.teamVesting!.amounts;
    for (let i = 0; i < accounts.length; i++) {
      const account = await teamVesting.vestingInfo(accounts[i]);
      expect(account.locked).to.eq(ethers.utils.parseEther(String(amounts[i])));
      expect(account.released).to.eq(0);
    }
  });

  it("Governor is correct", async () => {
    expect(await governor.token()).to.eq(token.address);
    expect(await governor.vesting()).to.eq(teamVesting.address);
    expect(await governor.timelock()).to.eq(executor.address);

    expect(await governor.votingDelay()).to.eq(config.deployment!.governor!.votingDelayDays * DAY);
    expect(await governor.votingPeriod()).to.eq(config.deployment!.governor!.votingPeriodDays * DAY);
    expect(await governor.proposalThreshold()).to.eq(ethers.utils.parseEther(String(config.deployment!.governor!.proposalThreshold)));
  });
});
