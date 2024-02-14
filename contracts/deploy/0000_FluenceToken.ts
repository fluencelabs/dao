import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log("Deploying Fluence Token...");

  const deployer = (await ethers.getSigners())[0].address;

  const deployResult = await hre.deployments.deploy("FluenceToken", {
    from: deployer,
    proxy: {
      proxyContract: "ERC1967Proxy",
      proxyArgs: ["{implementation}", "{data}"],
      execute: {
        methodName: "initialize",
        args: ["Fluence", "FLT", ethers.parseEther("1000000000")],
      },
    },
    waitConfirmations: 1,
  });

  console.log(`FLT token deployed to ${deployResult.address}\n`);
};

export default func;
func.tags = ["FluenceToken"];
