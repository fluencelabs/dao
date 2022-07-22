import chai, { expect, util } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, deployments, getNamedAccounts, waffle } from "hardhat";
import { FluenceToken, Vesting } from "../typechain";
import { BigNumber, Wallet } from "ethers";
import { THROW_ERROR_PREFIX, ZERO_ADDRESS } from "../utils/consts";
import { DAY, MONTH } from "../utils/time";
import { Config } from "../utils/config";

chai.use(waffle.solidity);

const vestingAmount = ethers.utils.parseEther("100");
const cliffDurationMonths = 3;
const vestingDurationMonths = 12;
const amountBySec: BigNumber = vestingAmount
  .div(BigNumber.from((cliffDurationMonths + vestingDurationMonths) * MONTH));

const setupTest = deployments.createFixture(
  async (
    hre: HardhatRuntimeEnvironment
  ): Promise<{
    token: FluenceToken;
    vesting: Vesting;
  }> => {
    Config.reset({
      etherscanApiKey: "",
      repotGas: false,
      mainnet: null,
      testnet: null,
    }, {
      token: {
        totalSupply: 100000000,
      }
    });

    await deployments.fixture([]);
    await hre.deployments.fixture(["FluenceToken"]);
    const { deployer, mainAccount } = await hre.getNamedAccounts();

    const tokenAddress = (await hre.deployments.get("FluenceToken")).address;
    const vesting = await hre.deployments.deploy("Vesting", {
      from: deployer,
      args: [
        tokenAddress,
        "TestVesting",
        "TV",
        cliffDurationMonths * MONTH,
        vestingDurationMonths * MONTH,
        [mainAccount],
        [vestingAmount]
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
      )) as Vesting
    };
  }
);

describe("Vesting", () => {
  let vesting: Vesting;
  let token: FluenceToken;
  let receiverAccount: Wallet;
  let startTime: number;

  const setTimeAfterStart = async (time: number) => {
    await ethers.provider.send("evm_setNextBlockTimestamp", [
      startTime + time
    ]);
    await ethers.provider.send("evm_mine", []);
  }

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
    startTime = (await vesting.startTimestamp()).toNumber()

    vesting = vesting.connect(receiverAccount);
  });

  it("when cliff is active #1", async () => {
    await expect(vesting.release(1)).to.be.revertedWith(
      `${THROW_ERROR_PREFIX} 'Not enough release amount'`
    );
  });

  it("when cliff is active #2", async () => {
    await setTimeAfterStart(cliffDurationMonths * MONTH)

    expect(await vesting.getReleaseAmount(receiverAccount.address)).to.eq(BigNumber.from(0))
  });

  it("after cliff", async () => {
    const time = cliffDurationMonths * MONTH + 1;
    await setTimeAfterStart(time)

    const expectedAmount = amountBySec.mul(BigNumber.from(time))

    const amount = await vesting.getReleaseAmount(receiverAccount.address);
    expect(amount).to.eq(expectedAmount);

    await expect(() => vesting.release(amount))
      .to.emit(token.address, "Transfer")
      .withArgs(ZERO_ADDRESS, receiverAccount, amount)
      .to.changeTokenBalance(token, receiverAccount, amount);


    expect(await vesting.balanceOf(receiverAccount.address)).to.eq(vestingAmount.sub(amount));
  });

  it("after cliff with random time", async () => {
    const time = Math.floor(Math.random() * (vestingDurationMonths + cliffDurationMonths) * MONTH) + cliffDurationMonths * MONTH;

    await setTimeAfterStart(time)
    const amount = await vesting.getReleaseAmount(receiverAccount.address);

    const expectedAmount = amountBySec.mul(BigNumber.from(time))
    expect(amount).to.eq(expectedAmount);

    await expect(() => vesting.release(amount))
      .to.emit(token.address, "Transfer")
      .withArgs(ZERO_ADDRESS, receiverAccount, amount)
      .to.changeTokenBalance(token, receiverAccount, amount);


    expect(await vesting.balanceOf(receiverAccount.address)).to.eq(vestingAmount.sub(amount));
  });

  it("all balance #1", async () => {
    await setTimeAfterStart((vestingDurationMonths + cliffDurationMonths) * MONTH)

    const amount = await vesting.getReleaseAmount(receiverAccount.address);
    expect(amount).to.eq(vestingAmount);

    await expect(() => vesting.release(vestingAmount))
      .to.emit(token.address, "Transfer")
      .withArgs(ZERO_ADDRESS, receiverAccount, vestingAmount)
      .to.changeTokenBalance(token, receiverAccount, vestingAmount);

    expect(await vesting.balanceOf(receiverAccount.address)).to.eq(0);
  });

  it("all balance #2", async () => {
    await setTimeAfterStart((vestingDurationMonths + cliffDurationMonths) * 3 * MONTH)

    const amount = await vesting.getReleaseAmount(receiverAccount.address);
    expect(amount).to.eq(vestingAmount);

    await expect(() => vesting.release(vestingAmount))
      .to.emit(token.address, "Transfer")
      .withArgs(ZERO_ADDRESS, receiverAccount, vestingAmount)
      .to.changeTokenBalance(token, receiverAccount, vestingAmount);

    expect(await vesting.balanceOf(receiverAccount.address)).to.eq(0);
  });

  it("transfer", async () => {
    const { deployer } = await getNamedAccounts()

    await expect(vesting.transfer(deployer, 1)).to.be.revertedWith(
      `${THROW_ERROR_PREFIX} 'Transfer is not allowed'`
    );
  });
});
