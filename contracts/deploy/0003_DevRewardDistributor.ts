import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { MONTH } from "../utils/time";
import { Config } from "../utils/config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const config = Config.get();

  const tokenAddress = (await hre.deployments.get("FluenceToken")).address;

  const initialReward = hre.ethers.utils.parseEther(
    String(config.deployment!.devRewardDistributor!.initialReward)
  );

  const rewardDistributor = await hre.deployments.deploy(
    "DevRewardDistributor",
    {
      from: deployer,
      args: [
        tokenAddress,
        (await hre.deployments.get("Executor_Proxy")).address,
        config.deployment!.devRewardDistributor!.merkleRoot,
        Math.floor(
          config.deployment!.devRewardDistributor!.halvePeriodMonths * MONTH
        ),
        config.deployment!.devRewardDistributor!.lockupPeriod * MONTH,
        initialReward,
        Math.floor(
          config.deployment!.devRewardDistributor!.claimingPeriodMonths * MONTH
        ),
        config.fluenceMultisig!,
        initialReward.mul(3),
      ],
      log: true,
      autoMine: true,
      waitConfirmations: 1,
    }
  );

  const totalRewards = hre.ethers.utils.parseEther(
    String(config.deployment!.devRewardDistributor!.totalRewards)
  );

  if (!totalRewards.isZero()) {
    await hre.deployments.execute(
      "FluenceToken",
      {
        from: deployer,
        log: true,
        autoMine: true,
        waitConfirmations: 1,
      },
      "transfer",
      rewardDistributor.address,
      totalRewards
    );
  }
};

export default func;
func.tags = ["DevRewardDistributor", "testnet"];
module.exports.dependencies = ["FluenceToken", "Executor"];
