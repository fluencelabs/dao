import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat";
import { DAY } from "../utils/time";
import { Config } from "../utils/config";
import { BigNumber } from "ethers";

const RPROPOSER_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("PROPOSER_ROLE")
);
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const config = Config.get();

  const governorDeployment = await hre.deployments.deploy("Governor", {
    from: deployer,
    proxy: {
      proxyContract: "ERC1967Proxy",
      proxyArgs: ["{implementation}", "{data}"],
      execute: {
        methodName: "initialize",
        args: [
          (await hre.deployments.get("FluenceToken")).address,
          (await hre.deployments.get("TeamVesting")).address,
          (await hre.deployments.get("Executor")).address,
          config.deployment!.governor!.votingDelayDays * DAY,
          config.deployment!.governor!.votingPeriodDays * DAY,
          hre.ethers.utils.parseEther(String(config.deployment!.governor!.proposalThreshold))
        ],
      },
    },
    log: true,
    autoMine: true,
    waitConfirmations: 1,
  });

  await hre.deployments.execute(
    "Executor",
    {
      from: deployer,
      log: true,
      autoMine: true,
      waitConfirmations: 1,
    },
    "grantRole",
    RPROPOSER_ROLE,
    governorDeployment.address
  );

  await hre.deployments.execute(
    "Executor",
    {
      from: deployer,
      log: true,
      autoMine: true,
      waitConfirmations: 1,
    },
    "revokeRole",
    RPROPOSER_ROLE,
    deployer
  );

  const balance: BigNumber = await hre.deployments.read(
    "FluenceToken",
    {
      from: deployer,
    },
    "balanceOf",
    deployer
  );

  if (!balance.isZero()) {
    await hre.deployments.execute(
      "FluenceToken",
      {
        from: deployer,
        log: true,
        autoMine: true,
        waitConfirmations: 1,
      },
      "transfer",
      governorDeployment.address,
      balance
    );
  }
};

export default func;
func.tags = ["Governor"];
module.exports.dependencies = ["FluenceToken", "TeamVesting", "Executor"];
