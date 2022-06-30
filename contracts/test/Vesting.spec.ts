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
        cliffDurationMonths,
        vestingDurationMonths,
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

    vesting = vesting.connect(receiverAccount);
  });

  it("release when cliff is active", async () => {
    await expect(vesting.release()).to.be.revertedWith(
      `${THROW_ERROR_PREFIX} 'Cliff period has not ended yet.'`
    );
  });

  it("release after cliff", async () => {
    const amount = vestingAmount
      .div(BigNumber.from(cliffDurationMonths + vestingDurationMonths))
      .mul(BigNumber.from(cliffDurationMonths));

    await ethers.provider.send("evm_increaseTime", [
      cliffDurationMonths * MONTH,
    ]);
    await ethers.provider.send("evm_mine", []);

    await expect(() => vesting.release())
      .to.emit(token.address, "Transfer")
      .withArgs(ZERO_ADDRESS, receiverAccount, amount)
      .to.changeTokenBalance(token, receiverAccount, amount);
  });

  it("release vesting month #1", async () => {
    const cliffAmount = vestingAmount
      .div(BigNumber.from(cliffDurationMonths + vestingDurationMonths))
      .mul(BigNumber.from(cliffDurationMonths));

    // get cliff amount
    await ethers.provider.send("evm_increaseTime", [
      cliffDurationMonths * MONTH,
    ]);
    await ethers.provider.send("evm_mine", []);
    await expect(() => vesting.release())
      .to.emit(token.address, "Transfer")
      .withArgs(ZERO_ADDRESS, receiverAccount, cliffAmount)
      .to.changeTokenBalance(token, receiverAccount, cliffAmount);

    // get vesting amounts for all month but without last
    let total = cliffAmount;
    for (let i = 0; i < vestingDurationMonths - 1; i++) {
      const amount = vestingAmount.div(
        BigNumber.from(cliffDurationMonths + vestingDurationMonths)
      );

      await ethers.provider.send("evm_increaseTime", [MONTH]);
      await ethers.provider.send("evm_mine", []);

      await expect(() => vesting.release())
        .to.emit(token.address, "Transfer")
        .withArgs(ZERO_ADDRESS, receiverAccount, amount)
        .to.changeTokenBalance(token, receiverAccount, amount);

      total = total.add(amount);
    }

    // get vesting amount for the last month
    const amount = vestingAmount.sub(total);
    await ethers.provider.send("evm_increaseTime", [MONTH]);
    await ethers.provider.send("evm_mine", []);

    await expect(() => vesting.release())
      .to.emit(token.address, "Transfer")
      .withArgs(ZERO_ADDRESS, receiverAccount, amount)
      .to.changeTokenBalance(token, receiverAccount, amount);

    total = total.add(amount);

    expect(total.toString()).to.eq(vestingAmount.toString());

    // verify that next month amount is 0
    await ethers.provider.send("evm_increaseTime", [MONTH]);
    await ethers.provider.send("evm_mine", []);

    await expect(vesting.release()).to.be.revertedWith(
      `${THROW_ERROR_PREFIX} 'Not enough release amount.'`
    );
  });

  it("release vesting with 0 amount", async () => {
    const amount = vestingAmount
      .div(BigNumber.from(cliffDurationMonths + vestingDurationMonths))
      .mul(BigNumber.from(cliffDurationMonths + 2));

    await ethers.provider.send("evm_increaseTime", [
      cliffDurationMonths * MONTH + 2 * MONTH,
    ]);
    await ethers.provider.send("evm_mine", []);
    await expect(() => vesting.release())
      .to.emit(token.address, "Transfer")
      .withArgs(ZERO_ADDRESS, receiverAccount, amount)
      .to.changeTokenBalance(token, receiverAccount, amount);

    await ethers.provider.send("evm_increaseTime", [5 * DAY]);
    await ethers.provider.send("evm_mine", []);

    await expect(vesting.release()).to.be.revertedWith(
      `${THROW_ERROR_PREFIX} 'Not enough release amount.'`
    );
  });
});
