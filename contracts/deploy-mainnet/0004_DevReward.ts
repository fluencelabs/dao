import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import { MINUTES, MONTH } from "../utils/time";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log("\nDeploying Team Vesting...");
  const deployer = (await ethers.getSigners())[0].address;

  const token = await hre.deployments.get("FluenceToken");

  const deployResult = await hre.deployments.deploy("DevRewardDistributor", {
    from: deployer,
    contract: "DevRewardDistributor",
    args: [
      token.address, // _token
      deployer, // executor
      "0x9054c3420799d2857b3706ca310823473c3b76dd666412134952aeba279e888a",
      30 * MINUTES, // harvestPeriod
      5 * MINUTES, // _lockupPeriod
      ethers.utils.parseEther("5000"), // initialReward
      12 * MONTH, // claimPeriod
      deployer, // cenceler
      ethers.utils.parseEther("50000000"), // maxClaimedSupply
    ],
    waitConfirmations: 1,
  });

  console.log(`DevRewardDistributor deployed to ${deployResult.address}\n`);
};

export default func;
func.tags = ["DevRewardDistributor", "mainnet"];
func.dependencies = ["FluenceToken"];
