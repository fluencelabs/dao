import chai, { expect } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, deployments, getNamedAccounts, waffle } from "hardhat";
import {
  Executor,
  FluenceToken,
  VestingWithVoting,
  DevRewardDistributor,
  Governor,
  Vesting,
  LPController,
  IERC20Metadata,
  DevERC20__factory,
} from "../typechain";
import { Config, Vesting as VestingConfig } from "../utils/config";
import { DAY, MONTH } from "../utils/time";
import { BigNumber } from "ethers";

chai.use(waffle.solidity);
const PROPOSER_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("PROPOSER_ROLE")
);
const DEFAULT_ADMIN_ROLE = ethers.utils.hexZeroPad([0], 32);
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
  let devRewardDistributor: DevRewardDistributor;
  let lpController: LPController;
  let investorsVesting: Vesting;
  let fluenceVesting: Vesting;
  let teamVesting: VestingWithVoting;
  let governor: Governor;
  let fluenceMultisig: ethers.Signer;

  let config: Config;

  const setupTest = deployments.createFixture(
    async (hre: HardhatRuntimeEnvironment) => {
      const hardhatSigners = await hre.ethers.getSigners();
      usdToken = await new DevERC20__factory(hardhatSigners[0]).deploy(
        "USD",
        "USD",
        ethers.utils.parseEther(String(lbpUSDAmount))
      );

      fluenceMultisig = hardhatSigners[hardhatSigners.length - 1];

      Config.reset(
        {
          etherscanApiKey: "",
          repotGas: false,
          mainnet: null,
          testnet: null,
        },
        {
          contracts: {
            usdToken: usdToken.address,
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
          token: {
            totalSupply: 10_000_000,
          },
          executor: {
            delayDays: 4,
          },
          devRewardDistributor: {
            merkleRoot:
              "0x1000000000000000000000000000000000000000000000000000000000000001",
            initialReward: 1,
            totalRewards: 100,
            lockupPeriod: 1,
            halvePeriodMonths: 3,
            claimingPeriodMonths: 5,
          },
          fluenceVesting: {
            delayDurationMonths: 2,
            vestingDurationMonths: 3,
            account: "0x0000000000000000000000000000000000000001",
            amount: 1,
          },
          investorsVesting: {
            delayDurationMonths: 2,
            vestingDurationMonths: 3,
            accounts: [
              "0x0000000000000000000000000000000000000002",
              "0x0000000000000000000000000000000000000003",
            ],
            amounts: [2, 3],
          },
          teamVesting: {
            delayDurationMonths: 2,
            vestingDurationMonths: 3,
            accounts: [
              "0x0000000000000000000000000000000000000003",
              "0x0000000000000000000000000000000000000004",
            ],
            amounts: [3, 4],
          },
          governor: {
            quorum: 1,
            votingDelayDays: 5,
            votingPeriodDays: 7,
            proposalThreshold: 12,
          },
        },
        fluenceMultisig.address
      );

      config = Config.get();

      await deployments.fixture([]);

      token = (await ethers.getContractAt(
        "FluenceToken",
        (
          await deployments.get("FluenceToken")
        ).address
      )) as FluenceToken;

      executor = (await ethers.getContractAt(
        "Executor",
        (
          await deployments.get("Executor")
        ).address
      )) as Executor;

      lpController = (await ethers.getContractAt(
        "LPController",
        (
          await deployments.get("LPController")
        ).address
      )) as LPController;

      devRewardDistributor = (await ethers.getContractAt(
        "DevRewardDistributor",
        (
          await deployments.get("DevRewardDistributor")
        ).address
      )) as DevRewardDistributor;

      investorsVesting = (await ethers.getContractAt(
        "Vesting",
        (
          await deployments.get("InvestorsVesting")
        ).address
      )) as Vesting;

      fluenceVesting = (await ethers.getContractAt(
        "Vesting",
        (
          await deployments.get("FluenceVesting")
        ).address
      )) as Vesting;

      teamVesting = (await ethers.getContractAt(
        "VestingWithVoting",
        (
          await deployments.get("TeamVesting")
        ).address
      )) as VestingWithVoting;

      governor = (await ethers.getContractAt(
        "Governor",
        (
          await deployments.get("Governor")
        ).address
      )) as Governor;
    }
  );

  before(async () => {
    await setupTest();
  });

  it("token is correct", async () => {
    expect(await token.name()).to.eq("Fluence Token");

    expect(await token.symbol()).to.eq("FLT");

    expect(await token.totalSupply()).to.eq(
      ethers.utils.parseEther(String(config.deployment!.token!.totalSupply))
    );

    expect(await token.owner()).to.eq(executor.address);
  });

  it("token balances are correct", async () => {
    const devRewardBalance = await token.balanceOf(
      devRewardDistributor.address
    );
    const investorsVestingBalance = await token.balanceOf(
      investorsVesting.address
    );
    const fluenceVestingBalance = await token.balanceOf(fluenceVesting.address);
    const teamVestingBalance = await token.balanceOf(teamVesting.address);

    expect(devRewardBalance).to.eq(
      ethers.utils.parseEther(
        String(config.deployment!.devRewardDistributor!.totalRewards)
      )
    );

    expect(investorsVestingBalance).to.eq(
      ethers.utils.parseEther(
        String(
          config.deployment!.investorsVesting!.amounts.reduce(
            (acc, cur) => acc + cur,
            0
          )
        )
      )
    );

    expect(fluenceVestingBalance).to.eq(
      ethers.utils.parseEther(String(config.deployment!.fluenceVesting!.amount))
    );

    expect(teamVestingBalance).to.eq(
      ethers.utils.parseEther(
        String(
          config.deployment!.teamVesting!.amounts.reduce(
            (acc, cur) => acc + cur,
            0
          )
        )
      )
    );

    expect(await token.balanceOf(executor.address)).to.eq(
      ethers.utils
        .parseEther(String(config.deployment!.token!.totalSupply))
        .sub(
          BigNumber.from(0)
            .add(devRewardBalance)
            .add(investorsVestingBalance)
            .add(fluenceVestingBalance)
            .add(teamVestingBalance)
            .add(
              ethers.utils.parseEther(
                String(config.deployment!.pool!.flt!.initialAmount)
              )
            )
        )
    );

    expect(await token.balanceOf(governor.address)).to.eq(0);

    // TODO: veify balancer
  });

  it("executor roles are correct", async () => {
    const { deployer } = await getNamedAccounts();

    expect(await executor.getMinDelay()).to.eq(
      config.deployment!.executor!.delayDays * DAY
    );

    expect(await executor.hasRole(DEFAULT_ADMIN_ROLE, deployer)).to.eq(false);
    expect(await executor.hasRole(DEFAULT_ADMIN_ROLE, executor.address)).to.eq(
      true
    );

    expect(await executor.hasRole(PROPOSER_ROLE, deployer)).to.eq(false);
    expect(await executor.hasRole(CANCELLER_ROLE, deployer)).to.eq(false);
    expect(await executor.hasRole(EXECUTOR_ROLE, deployer)).to.eq(false);

    expect(await executor.hasRole(PROPOSER_ROLE, governor.address)).to.eq(true);
    expect(await executor.hasRole(CANCELLER_ROLE, governor.address)).to.eq(
      true
    );
    expect(
      await executor.hasRole(
        EXECUTOR_ROLE,
        "0x0000000000000000000000000000000000000000"
      )
    ).to.eq(true);

    expect(
      await executor.hasRole(CANCELLER_ROLE, fluenceMultisig.address)
    ).to.eq(true);
  });

  it("DevRewardDistributor is correct", async () => {
    expect(await devRewardDistributor.token()).to.eq(token.address);
    expect(await devRewardDistributor.executor()).to.eq(executor.address);
    expect(await devRewardDistributor.merkleRoot()).to.eq(
      config.deployment!.devRewardDistributor!.merkleRoot
    );
    expect(await devRewardDistributor.halvePeriod()).to.eq(
      config.deployment!.devRewardDistributor!.halvePeriodMonths * MONTH
    );
    expect(await devRewardDistributor.initialReward()).to.eq(
      ethers.utils.parseEther(
        String(config.deployment!.devRewardDistributor!.initialReward)
      )
    );
    expect(await devRewardDistributor.claimingEndTime()).to.eq(
      (await devRewardDistributor.deployTime()).add(
        config.deployment!.devRewardDistributor!.claimingPeriodMonths * MONTH
      )
    );
  });

  it("InvestorVesting is correct", async () => {});

  it("Vestings is correct", async () => {
    for (const vesting of [teamVesting, investorsVesting]) {
      const startTimestamp = await vesting.startTimestamp();

      let cfg: VestingConfig;
      let name;
      let symbol;
      switch (vesting.address) {
        case investorsVesting.address:
          cfg = config.deployment!.investorsVesting!;
          name = "Investors Vesting";
          symbol = "FLTIV";
          break;
        case teamVesting.address:
          cfg = config.deployment!.teamVesting!;
          name = "Team Vesting";
          symbol = "FLTTV";
          break;
        case fluenceVesting.address:
          cfg = {
            delayDurationMonths:
              config.deployment!.fluenceVesting!.delayDurationMonths,
            vestingDurationMonths:
              config.deployment!.fluenceVesting!.vestingDurationMonths,
            accounts: [config.deployment!.fluenceVesting!.account],
            amounts: [config.deployment!.fluenceVesting!.amount],
          };
          name = "Fluence Vesting";
          symbol = "FLTFV";
          break;
        default:
          throw new Error("Unknown vesting");
      }

      expect(await vesting.name()).to.eq(name);
      expect(await vesting.symbol()).to.eq(symbol);
      expect(await vesting.decimals()).to.eq(18);

      expect(await vesting.token()).to.eq(token.address);
      expect(await vesting.vestingDuration()).to.eq(
        cfg.vestingDurationMonths * MONTH
      );
      const accounts = cfg.accounts;
      const amounts = cfg.amounts;
      for (let i = 0; i < accounts.length; i++) {
        const locked = await vesting.lockedBalances(accounts[i]);
        const balance = await vesting.balanceOf(accounts[i]);

        expect(locked).to.eq(balance);
        expect(locked).to.eq(ethers.utils.parseEther(String(amounts[i])));

        if (vesting.address === teamVesting.address) {
          const locked = await teamVesting.lockedBalances(accounts[i]);
          const balance = await teamVesting.balanceOf(accounts[i]);
          const delegatee = await teamVesting.delegates(accounts[i]);

          expect(delegatee).to.eq(accounts[i]);
          expect(locked).to.eq(balance);
          expect(locked).to.eq(ethers.utils.parseEther(String(amounts[i])));
        }
      }

      expect(await vesting.totalSupply()).to.eq(
        amounts
          .map((x) => ethers.utils.parseEther(String(x)))
          .reduce((partialSum, a) => partialSum.add(a), BigNumber.from(0))
      );
    }
  });

  it("Governor is correct", async () => {
    expect(await governor.token()).to.eq(token.address);
    expect(await governor.teamVesting()).to.eq(teamVesting.address);
    expect(await governor.timelock()).to.eq(executor.address);

    expect(await governor.votingDelay()).to.eq(
      Math.floor((config.deployment!.governor!.votingDelayDays * DAY) / 13.14)
    );
    expect(await governor.votingPeriod()).to.eq(
      Math.floor((config.deployment!.governor!.votingPeriodDays * DAY) / 13.14)
    );
    expect(await governor.proposalThreshold()).to.eq(
      ethers.utils.parseEther(
        String(config.deployment!.governor!.proposalThreshold)
      )
    );
  });
});
