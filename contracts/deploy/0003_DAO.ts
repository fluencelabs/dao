import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import { parseVestingAddresses } from "../utils/utils";
import { DAY, YEAR } from "../utils/time";
import { ethers } from "hardhat";

const SAFE_ADDRESS = "0x198691769280d07706a9c85B30565E928F8A9025";
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log("\nDeploying DAO...");
  const deployer = (await ethers.getSigners())[0].address;

  const token = await hre.deployments.get("FluenceToken");
  const teamVesting = await hre.deployments.get("TeamVesting");

  const deployExecutorResult = await hre.deployments.deploy("Executor", {
    from: deployer,
    proxy: {
      proxyContract: "ERC1967Proxy",
      proxyArgs: ["{implementation}", "{data}"],
      execute: {
        methodName: "initialize",
        args: [0],
      },
    },
    waitConfirmations: 1,
  });

  console.log(`Executor deployed to ${deployExecutorResult.address}`);

  const deployDAOResult = await hre.deployments.deploy("Governor", {
    from: deployer,
    proxy: {
      proxyContract: "ERC1967Proxy",
      proxyArgs: ["{implementation}", "{data}"],
      execute: {
        methodName: "initialize",
        args: [
          token.address,
          teamVesting.address,
          deployExecutorResult.address,
          1,
          Math.floor((1 * DAY) / 12),
          Math.floor((1 * DAY) / 12),
          1,
        ],
      },
    },
    waitConfirmations: 1,
  });

  console.log(`DAO deployed to ${deployDAOResult.address}`);

  console.log(deployer);
  const value = await hre.deployments.read(
    "FluenceToken",
    "balanceOf",
    deployer
  );

  console.log(
    "Remaining balance of deployer: ",
    ethers.formatEther(value.toString())
  );

  await hre.deployments.execute(
    "FluenceToken",
    { from: deployer, log: true },
    "transfer",
    SAFE_ADDRESS,
    value
  );
};

export default func;
func.tags = ["TeamVesting"];
func.dependencies = ["FluenceToken"];
