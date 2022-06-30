import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { MONTH } from "../utils/time";
import { Config } from "../utils/config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const config = Config.get();

  const vesting = await hre.deployments.deploy("TeamVesting", {
    from: deployer,
    contract: "VestingWithVoting",
    args: [
      (await hre.deployments.get("FluenceToken")).address,
      config.deployment!.teamVesting!.cliffDurationMonths,
      config.deployment!.teamVesting!.vestingDurationMonths,
      config.deployment!.teamVesting!.accounts,
      config.deployment!.teamVesting!.amounts.map(x => hre.ethers.utils.parseEther(String(x))),
      1
    ],
    log: true,
    autoMine: true,
    waitConfirmations: 1,
  });

  const total = config.deployment!.teamVesting!.amounts.reduce(
    (previousValue, currentValue) => previousValue + currentValue,
    0
  );

  if (total > 0) {
    await hre.deployments.execute(
      "FluenceToken",
      {
        from: deployer,
        log: true,
        autoMine: true,
        waitConfirmations: 1,
      },
      "transfer",
      vesting.address,
      hre.ethers.utils.parseEther(
        String(total)
      )
    );
  }
};

export default func;
func.tags = ["TeamVesting"];
module.exports.dependencies = ["FluenceToken"];
