import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import { HOURS, MINUTES } from "../utils/time";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log("\nDeploying Team Vesting...");
  const deployer = (await ethers.getSigners())[0].address;

  const token = await hre.deployments.get("FluenceToken");

  const deployResult = await hre.deployments.deploy("DevRewardDistributor", {
    from: deployer,
    contract: "DevRewardDistributor",
    args: [
      token.address,
      deployer,
      "0x82e1cd2ef5365e6db5b707763079758302a04bb39e2b5199f460fc316b74890a",
      2 * HOURS,
      10 * MINUTES,
      ethers.utils.parseEther("1000"),
      20 * HOURS,
      deployer,
    ],
    waitConfirmations: 1,
  });

  console.log(`DevRewardDistributor deployed to ${deployResult.address}\n`);

  // const teamVestingResult = await hre.deployments.deploy("TeamVesting", {
  //   from: deployer,
  //   contract: "VestingWithVoting",
  //   args: [
  //     token.address,
  //     "Fluence Token (Locked, Voting)",
  //     "FLT-LV #666",
  //     20 * HOURS,
  //     20 * HOURS,
  //     [
  //       "0x198691769280d07706a9c85B30565E928F8A9025",
  //       "0x074e67fF7cE5A91055E42AdA692289aE2225Be06",
  //     ],
  //     [
  //       ethers.utils.parseEther("100000000"),
  //       ethers.utils.parseEther("100000000"),
  //     ],
  //   ],
  //   waitConfirmations: 1,
  // });

  // console.log(`TeamVesting deployed to ${teamVestingResult.address}\n`);

  // const deployExecutorResult = await hre.deployments.deploy("Executor", {
  //   from: deployer,
  //   proxy: {
  //     proxyContract: "ERC1967Proxy",
  //     proxyArgs: ["{implementation}", "{data}"],
  //     execute: {
  //       methodName: "initialize",
  //       args: [180],
  //     },
  //   },
  //   waitConfirmations: 1,
  // });

  // console.log(`Executor deployed to ${deployExecutorResult.address}`);

  // const deployDAOResult = await hre.deployments.deploy("Governor", {
  //   from: deployer,
  //   proxy: {
  //     proxyContract: "ERC1967Proxy",
  //     proxyArgs: ["{implementation}", "{data}"],
  //     execute: {
  //       methodName: "initialize",
  //       args: [
  //         token.address,
  //         teamVestingResult.address,
  //         deployExecutorResult.address,
  //         1, // quorum
  //         Math.floor((10 * MINUTES) / 12), // voting delay
  //         Math.floor((10 * MINUTES) / 12), // voting period
  //         ethers.utils.parseEther("1000"), // proposal threshold
  //       ],
  //     },
  //   },
  //   waitConfirmations: 1,
  // });

  // console.log(`Governor deployed to ${deployDAOResult.address}`);
};

export default func;
func.tags = ["DevRewardDistributor", "mainnet"];
func.dependencies = ["FluenceToken"];
