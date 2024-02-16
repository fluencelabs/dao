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
const CANCELLER_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("CANCELLER_ROLE")
);
const DEFAULT_ADMIN_ROLE = ethers.utils.hexZeroPad([0], 32);
const DEFAULT_WAIT_CONFIRMATIONS = 1;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const config = Config.get();

  const executorAddress = (await hre.deployments.get("Executor")).address;
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
          executorAddress,
          config.deployment!.governor!.quorum,
          Math.floor(
            (config.deployment!.governor!.votingDelayDays * DAY) / 13.14
          ),
          Math.floor(
            (config.deployment!.governor!.votingPeriodDays * DAY) / 13.14
          ),
          hre.ethers.utils.parseEther(
            String(config.deployment!.governor!.proposalThreshold)
          ),
        ],
      },
    },
    log: true,
    autoMine: true,
    waitConfirmations: DEFAULT_WAIT_CONFIRMATIONS,
  });

  await hre.deployments.execute(
    "Executor",
    {
      from: deployer,
      log: true,
      autoMine: true,
      waitConfirmations: DEFAULT_WAIT_CONFIRMATIONS,
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
      waitConfirmations: DEFAULT_WAIT_CONFIRMATIONS,
    },
    "grantRole",
    CANCELLER_ROLE,
    governorDeployment.address
  );

  // Grant role of proposal canceller to the Fluence multisig.
  await hre.deployments.execute(
    "Executor",
    {
      from: deployer,
      log: true,
      autoMine: true,
      waitConfirmations: DEFAULT_WAIT_CONFIRMATIONS,
    },
    "grantRole",
    CANCELLER_ROLE,
    config.fluenceMultisig!
  );

  await hre.deployments.execute(
    "Executor",
    {
      from: deployer,
      log: true,
      autoMine: true,
      waitConfirmations: DEFAULT_WAIT_CONFIRMATIONS,
    },
    "revokeRole",
    DEFAULT_ADMIN_ROLE,
    deployer
  );

  // Send all tokens to Executor and announce ownership to Executor.
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
        waitConfirmations: DEFAULT_WAIT_CONFIRMATIONS,
      },
      "transfer",
      executorAddress,
      balance
    );
  }

  await hre.deployments.execute(
    "FluenceToken",
    {
      from: deployer,
      log: true,
      autoMine: true,
      waitConfirmations: DEFAULT_WAIT_CONFIRMATIONS,
    },
    "transferOwnership",
    executorAddress
  );
};

export default func;
func.tags = ["Governor", "testnet"];
module.exports.dependencies = ["FluenceToken", "TeamVesting", "Executor"];
