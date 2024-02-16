import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { Config } from "../utils/config";
import { ethers } from "ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const config = Config.get();

  await hre.deployments.deploy("FluenceToken", {
    from: deployer,
    proxy: {
      proxyContract: "ERC1967Proxy",
      proxyArgs: ["{implementation}", "{data}"],
      execute: {
        methodName: "initialize",
        args: [
          "Fluence Token",
          "FLT",
          ethers.utils.parseEther(
            String(config.deployment!.token!.totalSupply)
          ),
        ],
      },
    },
    log: true,
    autoMine: true,
    waitConfirmations: 1,
  });
};

export default func;
func.tags = ["FluenceToken", "testnet"];
