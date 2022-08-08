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
  FluenceToken__factory,
  IERC20,
  IERC20Metadata,
  ERC1967Proxy,
  Governor__factory,
  Executor__factory,
} from "../typechain";
import { Config } from "../utils/config";
import { MONTH } from "../utils/time";
import { BigNumberish, BytesLike, Wallet } from "ethers";
import { THROW_ERROR_PREFIX, ZERO_ADDRESS } from "../utils/consts";

chai.use(waffle.solidity);

describe("Deploy script", () => {
  let token: FluenceToken;
  let executor: Executor;
  let teamVesting: VestingWithVoting;
  let governor: Governor;

  let config: Config;

  let account: Wallet;

  const setupTest = deployments.createFixture(
    async (hre: HardhatRuntimeEnvironment) => {
      Config.reset(
        {
          etherscanApiKey: "",
          repotGas: false,
          mainnet: null,
          testnet: null,
        },
        {
          token: {
            totalSupply: 10_000_000,
          },
          executor: {
            delayDays: 50 / 86400,
          },
          teamVesting: {
            cliffDurationMonths: 2,
            vestingDurationMonths: 3,
            accounts: [account.address],
            amounts: [1_000_000],
          },
          governor: {
            quorum: 1,
            votingDelayDays: 50 / 86400,
            votingPeriodDays: 50 / 86400,
            proposalThreshold: 1,
          },
        }
      );

      config = Config.get();

      await deployments.fixture([]);
      await deployments.fixture([
        "FluenceToken",
        "TeamVesting",
        "Executor",
        "Governor",
      ]);

      token = (
        (await ethers.getContractAt(
          "FluenceToken",
          (
            await deployments.get("FluenceToken")
          ).address
        )) as FluenceToken
      ).connect(account);

      executor = (
        (await ethers.getContractAt(
          "Executor",
          (
            await deployments.get("Executor")
          ).address
        )) as Executor
      ).connect(account);

      teamVesting = (
        (await ethers.getContractAt(
          "VestingWithVoting",
          (
            await deployments.get("TeamVesting")
          ).address
        )) as VestingWithVoting
      ).connect(account);

      governor = (
        (await ethers.getContractAt(
          "Governor",
          (
            await deployments.get("Governor")
          ).address
        )) as Governor
      ).connect(account);
    }
  );

  const createVoteAndWaitProposal = async (
    targets: string[],
    values: BigNumberish[],
    calldatas: BytesLike[],
    description: string
  ) => {
    const hash = await governor.hashProposal(
      targets,
      values,
      calldatas,
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
    );

    await governor.propose(targets, values, calldatas, description);

    let delay = (await governor.votingDelay()).toNumber();
    for (let i = 0; i <= delay; i++) {
      await ethers.provider.send("evm_mine", []);
    }

    await governor.castVote(hash, 1);

    delay = (await governor.votingPeriod()).toNumber();
    for (let i = 0; i <= delay; i++) {
      await ethers.provider.send("evm_mine", []);
    }

    await governor.queue(
      targets,
      values,
      calldatas,
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description))
    );

    delay = (await executor.getMinDelay()).toNumber();
    for (let i = 0; i <= delay; i++) {
      await ethers.provider.send("evm_mine", []);
    }
  };

  before(async () => {
    const { mainAccount } = await getNamedAccounts();
    const accounts = await waffle.provider.getWallets();
    for (let i = 0; i < accounts.length; i++) {
      if (accounts[i].address == mainAccount) {
        account = accounts[i];
        break;
      }
    }
  });

  beforeEach(async () => {
    await setupTest();
  });

  it("getVotes #1 (vesting amount only)", async () => {
    await token.delegate(account.address);
    await teamVesting.delegate(account.address);

    await ethers.provider.send("evm_mine", []);

    expect(
      await governor.getVotes(
        account.address,
        (await ethers.provider.getBlockNumber()) - 1
      )
    ).to.eq(
      ethers.utils.parseEther(
        String(config.deployment!.teamVesting!.amounts[0])
      )
    );
  });

  it("getVotes #1 (vesting amount + balance amount)", async () => {
    await token.delegate(account.address);
    await teamVesting.delegate(account.address);

    await ethers.provider.send("evm_setNextBlockTimestamp", [
      (await ethers.provider.getBlock("latest")).timestamp +
        (config.deployment!.teamVesting!.cliffDurationMonths * MONTH + 1),
    ]);
    await ethers.provider.send("evm_mine", []);

    const amount = await teamVesting.getAvailableAmount(account.address);
    expect(amount).to.not.eq(0);

    await teamVesting.transfer(ZERO_ADDRESS, amount);

    await ethers.provider.send("evm_mine", []);

    const totalAmount = ethers.utils.parseEther(
      String(config.deployment!.teamVesting!.amounts[0])
    );
    const blockNumber = (await ethers.provider.getBlockNumber()) - 1;
    expect(await teamVesting.getPastVotes(account.address, blockNumber)).to.eq(
      totalAmount.sub(amount)
    );
    expect(await token.balanceOf(account.address)).to.eq(amount);

    expect(await governor.getVotes(account.address, blockNumber)).to.eq(
      totalAmount
    );
  });

  it("getVotes #1 (balance only)", async () => {
    await token.delegate(account.address);
    await teamVesting.delegate(account.address);

    await ethers.provider.send("evm_setNextBlockTimestamp", [
      (await ethers.provider.getBlock("latest")).timestamp +
        ((config.deployment!.teamVesting!.cliffDurationMonths +
          config.deployment!.teamVesting!.vestingDurationMonths) *
          MONTH +
          1),
    ]);

    await ethers.provider.send("evm_mine", []);

    const amount = await teamVesting.getAvailableAmount(account.address);
    expect(amount).to.not.eq(0);

    await teamVesting.transfer(ZERO_ADDRESS, amount);

    await ethers.provider.send("evm_mine", []);

    const totalAmount = ethers.utils.parseEther(
      String(config.deployment!.teamVesting!.amounts[0])
    );

    const blockNumber = (await ethers.provider.getBlockNumber()) - 1;
    expect(await teamVesting.getPastVotes(account.address, blockNumber)).to.eq(
      0
    );

    expect(await token.balanceOf(account.address)).to.eq(totalAmount);

    expect(await governor.getVotes(account.address, blockNumber)).to.eq(
      totalAmount
    );
  });

  it("Update governor", async () => {
    await teamVesting.delegate(account.address);
    await ethers.provider.send("evm_mine", []);

    const newImp = await new Governor__factory(
      ethers.provider.getSigner(account.address)
    ).deploy();

    const data = (await governor.populateTransaction.upgradeTo(newImp.address))
      .data!;

    await createVoteAndWaitProposal([governor.address], [0], [data], "");

    await expect(
      governor.execute(
        [governor.address],
        [0],
        [data],
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(""))
      )
    )
      .to.emit(governor, "Upgraded")
      .withArgs(newImp.address);
  });

  it("Update executor", async () => {
    await teamVesting.delegate(account.address);
    await ethers.provider.send("evm_mine", []);

    const newImp = await new Executor__factory(
      ethers.provider.getSigner(account.address)
    ).deploy();

    const data = (await executor.populateTransaction.upgradeTo(newImp.address))
      .data!;

    await createVoteAndWaitProposal([executor.address], [0], [data], "");

    await expect(
      governor.execute(
        [executor.address],
        [0],
        [data],
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(""))
      )
    )
      .to.emit(executor, "Upgraded")
      .withArgs(newImp.address);
  });

  it("Try update govern using not owner", async () => {
    await teamVesting.delegate(account.address);
    await ethers.provider.send("evm_mine", []);

    const newImp = await new Executor__factory(
      ethers.provider.getSigner(account.address)
    ).deploy();

    await expect(governor.upgradeTo(newImp.address)).to.be.revertedWith(
      `${THROW_ERROR_PREFIX} 'Only the executor contract can authorize an upgrade'`
    );
  });

  it("Try update executor using not owner", async () => {
    await teamVesting.delegate(account.address);
    await ethers.provider.send("evm_mine", []);

    const newImp = await new Governor__factory(
      ethers.provider.getSigner(account.address)
    ).deploy();

    await expect(executor.upgradeTo(newImp.address)).to.be.revertedWith(
      `${THROW_ERROR_PREFIX} 'Only this contract can authorize an upgrade'`
    );
  });
});
