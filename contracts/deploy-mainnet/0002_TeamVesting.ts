import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import { parseVestingAddresses } from "../utils/utils";
import { HOURS, MINUTES } from "../utils/time";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log("\nDeploying Team Vesting...");
  const deployer = (await ethers.getSigners())[0].address;

  const { accounts, amounts, totalAmount } =
    await parseVestingAddresses("./teamVesting.csv");

  const token = await hre.deployments.get("FluenceToken");

  const deployResult = await hre.deployments.deploy("TeamVesting", {
    from: deployer,
    contract: "VestingWithVoting",
    args: [
      token.address,
      "Fluence Token (Locked, Voting)",
      "FLT-LV",
      MINUTES,
      20 * HOURS,
      accounts,
      amounts,
    ],
    waitConfirmations: 1,
  });

  console.log(`Team Vesting deployed to ${deployResult.address}\n`);

  await hre.deployments.execute(
    "FluenceToken",
    { from: deployer, log: true },
    "transfer",
    deployResult.address,
    totalAmount
  );
};

export default func;
func.tags = ["TeamVesting", "mainnet"];
func.dependencies = ["FluenceToken"];
