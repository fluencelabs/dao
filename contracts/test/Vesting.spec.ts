import chai, { expect } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, deployments, getNamedAccounts, waffle } from "hardhat";
import { FluenceToken, Vesting } from "../typechain";
import { BigNumber, Wallet } from "ethers";
import { THROW_ERROR_PREFIX, ZERO_ADDRESS } from "../utils/consts";
import { MONTH } from "../utils/time";
import { Config } from "../utils/config";

chai.use(waffle.solidity);

const vestingAmount = ethers.utils.parseEther("100");
const delayDurationMonths = 3;
const vestingDurationMonths = 12;
const amountBySec: BigNumber = vestingAmount.div(
  BigNumber.from(vestingDurationMonths * MONTH)
);

const setupTest = deployments.createFixture(
  async (
    hre: HardhatRuntimeEnvironment
  ): Promise<{
    token: FluenceToken;
    vesting: Vesting;
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
          totalSupply: 100000000,
        },
      },
      fluenceMultisig.address
    );

    await hre.deployments.fixture(["FluenceToken"]);
    const { deployer, mainAccount } = await hre.getNamedAccounts();

    const tokenAddress = (await hre.deployments.get("FluenceToken")).address;
    const vesting = await hre.deployments.deploy("Vesting", {
      from: deployer,
      args: [
        tokenAddress,
        "TestVesting",
        "TV",
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
        "Vesting",
        vesting.address
      )) as Vesting,
    };
  }
);

describe("Vesting", () => {
  let vesting: Vesting;
  let token: FluenceToken;
  let receiverAccount: Wallet;
  let vestingStartTime: number;

  const setTimeAfterVestingStart = async (time: number) => {
    await ethers.provider.send("evm_setNextBlockTimestamp", [vestingStartTime + time]);
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
    vestingStartTime = (await vesting.startTimestamp()).toNumber();

    vesting = vesting.connect(receiverAccount);
  });

  it("when in delay period #1", async () => {
    await expect(vesting.transfer(ZERO_ADDRESS, 1)).to.be.revertedWith(
      `${THROW_ERROR_PREFIX} 'Not enough the release amount'`
    );
  });

  it("when in delay period #2", async () => {
    await setTimeAfterVestingStart(0);

    expect(await vesting.getAvailableAmount(receiverAccount.address)).to.eq(
      BigNumber.from(0)
    );
  });

  it("after delay period", async () => {
    const vestingTimePassed = 1;
    await setTimeAfterVestingStart(vestingTimePassed);

    console.log('amountBySec', amountBySec)
    console.log(MONTH);
    const expectedAmount = amountBySec.mul(BigNumber.from(vestingTimePassed));
    console.log('expectedAmount', expectedAmount)

    const amount = await vesting.getAvailableAmount(receiverAccount.address);
    expect(amount).to.eq(expectedAmount);

    const balanceSnapshot = await token.balanceOf(receiverAccount.address);

    const tx = await vesting.transfer(ZERO_ADDRESS, amount);
    await expect(tx)
      .to.emit(token, "Transfer")
      .withArgs(vesting.address, receiverAccount.address, amount);

    expect(await token.balanceOf(receiverAccount.address)).to.eq(
      balanceSnapshot.add(amount)
    );
    expect(await vesting.balanceOf(receiverAccount.address)).to.eq(
      vestingAmount.sub(amount)
    );
  });

  it("after cliff with random time", async () => {
    const time = Math.floor(Math.random() * vestingDurationMonths * MONTH);

    await setTimeAfterVestingStart(time);
    const amount = await vesting.getAvailableAmount(receiverAccount.address);

    const expectedAmount = amountBySec.mul(BigNumber.from(time));
    expect(amount).to.eq(expectedAmount);

    const balanceSnapshot = await token.balanceOf(receiverAccount.address);

    await expect(await vesting.transfer(ZERO_ADDRESS, amount))
      .to.emit(token, "Transfer")
      .withArgs(vesting.address, receiverAccount.address, amount);

    expect(await token.balanceOf(receiverAccount.address)).to.eq(
      balanceSnapshot.add(amount)
    );
    expect(await vesting.balanceOf(receiverAccount.address)).to.eq(
      vestingAmount.sub(amount)
    );
  });

  it("all balance #1", async () => {
    await setTimeAfterVestingStart(vestingDurationMonths * MONTH);

    const amount = await vesting.getAvailableAmount(receiverAccount.address);
    expect(amount).to.eq(vestingAmount);

    const balanceSnapshot = await token.balanceOf(receiverAccount.address);

    await expect(await vesting.transfer(ZERO_ADDRESS, vestingAmount))
      .to.emit(token, "Transfer")
      .withArgs(vesting.address, receiverAccount.address, vestingAmount);

    expect(await token.balanceOf(receiverAccount.address)).to.eq(
      balanceSnapshot.add(vestingAmount)
    );
    expect(await vesting.balanceOf(receiverAccount.address)).to.eq(0);
  });

  it("all balance #2", async () => {
    await setTimeAfterVestingStart(vestingDurationMonths * 3 * MONTH);

    const amount = await vesting.getAvailableAmount(receiverAccount.address);
    expect(amount).to.eq(vestingAmount);

    const balanceSnapshot = await token.balanceOf(receiverAccount.address);

    await expect(await vesting.transfer(ZERO_ADDRESS, vestingAmount))
      .to.emit(token, "Transfer")
      .withArgs(vesting.address, receiverAccount.address, vestingAmount);

    expect(await token.balanceOf(receiverAccount.address)).to.eq(
      balanceSnapshot.add(vestingAmount)
    );
    expect(await vesting.balanceOf(receiverAccount.address)).to.eq(0);
  });

  it("transfer", async () => {
    const { deployer } = await getNamedAccounts();

    await expect(vesting.transfer(deployer, 1)).to.be.revertedWith(
      `${THROW_ERROR_PREFIX} 'Transfer allowed only to the zero address'`
    );
  });

  it("balanceOf", async () => {
    expect(await vesting.balanceOf(receiverAccount.address)).to.eq(
      vestingAmount
    );
  });

  it("transferFrom full", async () => {
    await setTimeAfterVestingStart(vestingDurationMonths * 3 * MONTH);

    const amount = await vesting.getAvailableAmount(receiverAccount.address);
    expect(amount).to.eq(vestingAmount);

    const balanceSnapshot = await token.balanceOf(receiverAccount.address);

    await expect(await vesting.transfer(ZERO_ADDRESS, 0))
      .to.emit(token, "Transfer")
      .withArgs(vesting.address, receiverAccount.address, vestingAmount);

    expect(await token.balanceOf(receiverAccount.address)).to.eq(
      balanceSnapshot.add(vestingAmount)
    );
    expect(await vesting.balanceOf(receiverAccount.address)).to.eq(0);
  });
});
