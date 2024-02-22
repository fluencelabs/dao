import chai, { expect } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, deployments, getNamedAccounts, waffle } from "hardhat";
import { DevRewardDistributor, Executor, FluenceToken } from "../typechain";
import { MerkleTree } from "merkletreejs";
import { BigNumber, Wallet } from "ethers";
import { THROW_ERROR_PREFIX } from "../utils/consts";
import { Config } from "../utils/config";

chai.use(waffle.solidity);

const generateMerkleTree = (addresses: Array<string>): MerkleTree => {
  const leaves = addresses.map((v, index) =>
    ethers.utils.arrayify(
      ethers.utils.solidityPack(
        ["uint32", "address"],
        [index, ethers.utils.arrayify(v)]
      )
    )
  );
  return new MerkleTree(leaves, ethers.utils.keccak256, {
    hashLeaves: true,
    sortPairs: true,
  });
};

const setupTest = deployments.createFixture(
  async (
    hre: HardhatRuntimeEnvironment
  ): Promise<{
    rewardDistributor: DevRewardDistributor;
    merkleTree: MerkleTree;
    devAccounts: Array<Wallet>;
    token: FluenceToken;
    executor: Executor;
    fluenceMultisig: ethers.Signer;
  }> => {
    const devAccounts = Array(100)
      .fill(1)
      .map((x) => ethers.Wallet.createRandom());

    const merkleTree = await generateMerkleTree(
      devAccounts.map((x) => x.address)
    );

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
        executor: {
          delayDays: 1,
        },
        devRewardDistributor: {
          merkleRoot: merkleTree.getHexRoot(),
          totalRewards: 100,
          initialReward: 1,
          lockupPeriod: 1,
          halvePeriodMonths: 1,
          claimingPeriodMonths: 3,
        },
      },
      fluenceMultisig.address
    );

    await hre.deployments.fixture([
      "FluenceToken",
      "Executor",
      "DevRewardDistributor",
    ]);

    const token = (await ethers.getContractAt(
      "FluenceToken",
      (
        await hre.deployments.get("FluenceToken")
      ).address
    )) as FluenceToken;

    return {
      rewardDistributor: (await ethers.getContractAt(
        "DevRewardDistributor",
        (
          await hre.deployments.get("DevRewardDistributor")
        ).address
      )) as DevRewardDistributor,
      merkleTree: merkleTree,
      devAccounts: devAccounts,
      token: token,
      executor: (await ethers.getContractAt(
        "Executor",
        (
          await hre.deployments.get("Executor")
        ).address
      )) as Executor,
      fluenceMultisig: fluenceMultisig,
    };
  }
);

const randomNumberWithout = (
  max: number,
  withoutNumber: number = -1
): number => {
  let accountId = Math.floor(Math.random() * max);
  if (accountId == withoutNumber) {
    accountId = randomNumberWithout(max, withoutNumber);
  }

  return accountId;
};

describe("DevRewardDistributor", () => {
  let rewardDistributor: DevRewardDistributor;
  let token: FluenceToken;
  let executor: Executor;
  let tempDevAccounts: Array<Wallet>;
  let tree: MerkleTree;

  let developerAccount: Wallet;
  let fluenceMultisig: ethers.Signer;

  before(async () => {
    const { mainAccount } = await getNamedAccounts();
    const accounts = await waffle.provider.getWallets();
    for (let i = 0; i < accounts.length; i++) {
      if (accounts[i].address == mainAccount) {
        developerAccount = accounts[i];
        break;
      }
    }
  });

  beforeEach(async () => {
    const settings = await setupTest();
    tempDevAccounts = settings.devAccounts;
    tree = settings.merkleTree;
    token = settings.token;
    executor = settings.executor;
    fluenceMultisig = settings.fluenceMultisig;

    rewardDistributor = settings.rewardDistributor.connect(developerAccount);
  });

  const getRandomAccountInfo = (
    withoutNumber: number = -1
  ): {
    account: Wallet;
    leaf: string;
    accountId: number;
  } => {
    const accountId = randomNumberWithout(
      tempDevAccounts.length,
      withoutNumber
    );
    const account = tempDevAccounts[accountId];
    const leaf = ethers.utils.solidityKeccak256(
      ["uint32", "address"],
      [accountId, account.address]
    );

    return {
      account: account,
      leaf: leaf,
      accountId: accountId,
    };
  };

  it("claiming is active", async () => {
    expect(await rewardDistributor.isClaimingActive()).to.be.true;
  });

  it("claim reward", async () => {
    let lastId = -1;
    for (let i = 0; i < 2; i++) {
      const initTotalSupply = await rewardDistributor.totalSupply();
      const claimedSupply = await rewardDistributor.claimedSupply();

      const info = getRandomAccountInfo(lastId);
      lastId = info.accountId;

      const reward = await rewardDistributor.currentReward();

      const signer = (await ethers.getSigners())[i];
      const tx = await rewardDistributor
        .connect(signer)
        .claimTokens(
          info.accountId,
          tree.getHexProof(info.leaf),
          info.account.address,
          await info.account.signMessage(ethers.utils.arrayify(signer.address))
        );

      await expect(tx)
        .to.emit(rewardDistributor, "Transfer")
        .withArgs(ethers.constants.AddressZero, signer.address, reward);

      await expect(await rewardDistributor.balanceOf(signer.address)).to.eq(
        reward
      );

      const lockedBalance = await rewardDistributor.lockedBalances(
        signer.address
      );

      const txReceipt = await tx.wait();
      const block = await ethers.provider.getBlock(txReceipt.blockNumber);

      expect(lockedBalance.amount).to.eq(reward);
      expect(lockedBalance.unlockTime).to.eq(
        (await rewardDistributor.lockupPeriod()).add(block.timestamp)
      );

      expect(await rewardDistributor.isClaimed(info.accountId)).to.be.true;

      expect(await rewardDistributor.totalSupply()).to.eq(
        initTotalSupply.add(reward)
      );
      expect(await rewardDistributor.claimedSupply()).to.eq(
        claimedSupply.add(reward)
      );
    }
  });

  it("transfer after lockup period", async () => {
    let lastId = -1;
    const info = getRandomAccountInfo(lastId);
    lastId = info.accountId;

    const reward = await rewardDistributor.currentReward();

    const tx = await rewardDistributor.claimTokens(
      info.accountId,
      tree.getHexProof(info.leaf),
      info.account.address,
      await info.account.signMessage(
        ethers.utils.arrayify(developerAccount.address)
      )
    );

    const txReceipt = await tx.wait();
    const block = await ethers.provider.getBlock(txReceipt.blockNumber);
    const unlockTime = (await rewardDistributor.lockupPeriod()).add(
      block.timestamp
    );

    const accountSnapshotBalance = await token.balanceOf(
      developerAccount.address
    );
    const contractSnapshotBalance = await token.balanceOf(
      rewardDistributor.address
    );

    await ethers.provider.send("evm_increaseTime", [unlockTime.toNumber()]);

    const totalSupply = await rewardDistributor.totalSupply();
    const claimedSupply = await rewardDistributor.claimedSupply();
    const transferTx = await rewardDistributor.transfer(
      developerAccount.address,
      reward
    );

    expect(await rewardDistributor.totalSupply()).to.eq(
      totalSupply.sub(reward)
    );

    await expect(transferTx)
      .to.emit(token, "Transfer")
      .withArgs(rewardDistributor.address, developerAccount.address, reward);

    await expect(await token.balanceOf(developerAccount.address)).to.eq(
      accountSnapshotBalance.add(reward)
    );
    await expect(await token.balanceOf(rewardDistributor.address)).to.eq(
      contractSnapshotBalance.sub(reward)
    );
    expect(await rewardDistributor.claimedSupply()).to.eq(claimedSupply);
  });

  it("try transfer before lockup period", async () => {
    let lastId = -1;
    const info = getRandomAccountInfo(lastId);
    lastId = info.accountId;

    const reward = await rewardDistributor.currentReward();

    await rewardDistributor.claimTokens(
      info.accountId,
      tree.getHexProof(info.leaf),
      info.account.address,
      await info.account.signMessage(
        ethers.utils.arrayify(developerAccount.address)
      )
    );
    await await expect(
      rewardDistributor.transfer(developerAccount.address, reward)
    ).to.to.be.revertedWith(`${THROW_ERROR_PREFIX} 'Tokens are locked'`);
  });

  it("try transfer with invalid value", async () => {
    let lastId = -1;
    const info = getRandomAccountInfo(lastId);
    lastId = info.accountId;

    const reward = await rewardDistributor.currentReward();

    await rewardDistributor.claimTokens(
      info.accountId,
      tree.getHexProof(info.leaf),
      info.account.address,
      await info.account.signMessage(
        ethers.utils.arrayify(developerAccount.address)
      )
    );
    await await expect(
      rewardDistributor.transfer(developerAccount.address, 100)
    ).to.to.be.revertedWith(`${THROW_ERROR_PREFIX} 'Invalid amount'`);
  });

  it("try claim for claimed user", async () => {
    const info = getRandomAccountInfo();

    await rewardDistributor.claimTokens(
      info.accountId,
      tree.getHexProof(info.leaf),
      info.account.address,
      await info.account.signMessage(
        ethers.utils.arrayify(developerAccount.address)
      )
    );

    expect(await rewardDistributor.isClaimed(info.accountId)).to.be.true;

    await expect(
      rewardDistributor.claimTokens(
        info.accountId,
        tree.getHexProof(info.leaf),
        info.account.address,
        await info.account.signMessage(
          ethers.utils.arrayify(developerAccount.address)
        )
      )
    ).to.be.revertedWith(`${THROW_ERROR_PREFIX} 'Tokens already claimed'`);
  });

  it("try claim with invalid merkle proof", async () => {
    const info = getRandomAccountInfo();
    const badInfo = getRandomAccountInfo(info.accountId);

    await expect(
      rewardDistributor.claimTokens(
        info.accountId,
        tree.getHexProof(badInfo.leaf),
        info.account.address,
        await info.account.signMessage(
          ethers.utils.arrayify(developerAccount.address)
        )
      )
    ).to.to.be.revertedWith(`${THROW_ERROR_PREFIX} 'Valid proof required'`);
  });

  it("try claim with invalid sign", async () => {
    const info = getRandomAccountInfo();

    await expect(
      rewardDistributor.claimTokens(
        info.accountId,
        tree.getHexProof(info.leaf),
        info.account.address,
        await ethers.Wallet.createRandom().signMessage(
          ethers.utils.arrayify(developerAccount.address)
        )
      )
    ).to.to.be.revertedWith(`${THROW_ERROR_PREFIX} 'Invalid signature'`);
  });

  it("claiming is not active", async () => {
    const period = await rewardDistributor.claimingEndTime();

    await ethers.provider.send("evm_increaseTime", [period.toNumber()]);
    await ethers.provider.send("evm_mine", []);

    expect(await rewardDistributor.isClaimingActive()).to.be.false;
  });

  it("try claim when claiming is not active", async () => {
    const period = await rewardDistributor.claimingEndTime();

    await ethers.provider.send("evm_increaseTime", [period.toNumber()]);
    await ethers.provider.send("evm_mine", []);

    expect(await rewardDistributor.isClaimingActive()).to.be.false;

    const info = getRandomAccountInfo();

    await expect(
      rewardDistributor.claimTokens(
        info.accountId,
        tree.getHexProof(info.leaf),
        info.account.address,
        await info.account.signMessage(
          ethers.utils.arrayify(developerAccount.address)
        )
      )
    ).to.be.revertedWith(
      `${THROW_ERROR_PREFIX} 'Claiming status is not as expected'`
    );
  });

  it("claim reward when claiming is not active", async () => {
    const period = await rewardDistributor.claimingEndTime();

    await ethers.provider.send("evm_increaseTime", [period.toNumber()]);
    await ethers.provider.send("evm_mine", []);

    expect((await rewardDistributor.currentReward()).toNumber()).to.be.eq(0);
  });

  it("currentReward after half period", async () => {
    const period = await rewardDistributor.halvePeriod();

    await ethers.provider.send("evm_increaseTime", [period.toNumber()]);
    await ethers.provider.send("evm_mine", []);

    expect((await rewardDistributor.currentReward()).toString()).to.be.eq(
      (await rewardDistributor.initialReward()).div(2).toString()
    );
  });

  it("try to claim more then max", async () => {
    const maxClaimedSupply = await rewardDistributor.maxClaimedSupply();

    let lastId = -1;
    for (
      let i = 0;
      i < Number(maxClaimedSupply.div(await rewardDistributor.initialReward()));
      i++
    ) {
      const signer = (await ethers.getSigners())[i];

      const info = getRandomAccountInfo(lastId);
      lastId = info.accountId;

      await rewardDistributor
        .connect(signer)
        .claimTokens(
          info.accountId,
          tree.getHexProof(info.leaf),
          info.account.address,
          await info.account.signMessage(ethers.utils.arrayify(signer.address))
        );
    }

    const info = getRandomAccountInfo(lastId);
    await expect(
      rewardDistributor.claimTokens(
        info.accountId,
        tree.getHexProof(info.leaf),
        info.account.address,
        await info.account.signMessage(
          ethers.utils.arrayify(developerAccount.address)
        )
      )
    ).to.to.be.revertedWith(
      `${THROW_ERROR_PREFIX} 'Total claimed exceeded max limit`
    );
  });

  async function _isTransferedToExecutor(
    transaction: any,
    amountBefore: BigNumber
  ) {
    await expect(transaction)
      .to.emit(rewardDistributor, "TransferUnclaimed")
      .withArgs(amountBefore);

    await expect(transaction)
      .to.emit(token, "Transfer")
      .withArgs(rewardDistributor.address, executor.address, amountBefore);

    expect(await token.balanceOf(executor.address)).to.eq(amountBefore);
    expect(await token.balanceOf(rewardDistributor.address)).to.eq(
      BigNumber.from(0)
    );
  }

  it("transfer unclaimed when fluence multisig used (#withdraw)", async () => {
    const amount = await token.balanceOf(rewardDistributor.address);

    const tx = await rewardDistributor.connect(fluenceMultisig).withdraw();
    await _isTransferedToExecutor(tx, amount);
  });

  it("throw when transfer unclaimed not from multisig", async () => {
    await expect(rewardDistributor.withdraw()).to.be.revertedWith(
      `${THROW_ERROR_PREFIX} 'Caller is not a canceler'`
    );
  });
});
