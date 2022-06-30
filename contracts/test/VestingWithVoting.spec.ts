import chai, { expect } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, deployments, getNamedAccounts, waffle } from "hardhat";
import { FluenceToken, VestingWithVoting } from "../typechain";
import { BigNumber, Wallet } from "ethers";
import { MONTH } from "../utils/time";
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
    vesting: VestingWithVoting;
  }> => {
    Config.reset({
      etherscanApiKey: "",
      repotGas: false,
      mainnet: null,
      testnet: null,
    }, {
      token: {
        totalSupply: 1000000,
      },
    });

    await deployments.fixture([]);
    await hre.deployments.fixture(["FluenceToken"]);

    const { deployer, mainAccount } = await hre.getNamedAccounts();

    const tokenAddress = (await hre.deployments.get("FluenceToken")).address;
    const vesting = await hre.deployments.deploy("VestingWithVoting", {
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
        "VestingWithVoting",
        vesting.address
      )) as VestingWithVoting,
    };
  }
);

describe("Vesting", () => {
  let vesting: VestingWithVoting;
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

  it("get votes", async () => {
    expect(await vesting.getVotes(receiverAccount.address)).to.eq(
      vestingAmount
    );
  });

  it("get votes after release", async () => {
    const cliffAmount = vestingAmount
      .div(BigNumber.from(cliffDurationMonths + vestingDurationMonths))
      .mul(BigNumber.from(cliffDurationMonths));

    await ethers.provider.send("evm_increaseTime", [
      cliffDurationMonths * MONTH,
    ]);
    await ethers.provider.send("evm_mine", []);
    await vesting.release();

    expect(await vesting.getVotes(receiverAccount.address)).to.eq(
      vestingAmount.sub(cliffAmount)
    );
  });
});
