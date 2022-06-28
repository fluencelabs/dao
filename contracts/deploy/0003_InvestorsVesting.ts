import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { Config } from "../utils/config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const config = Config.get();

  const vesting = await hre.deployments.deploy("InvestorsVesting", {
    from: deployer,
    contract: "Vesting",
    args: [
      (await hre.deployments.get("FluenceToken")).address,
      config.deployment!.investorsVesting!.cliffDurationMonths,
      config.deployment!.investorsVesting!.vestingDurationMonths,
      config.deployment!.investorsVesting!.accounts,
      config.deployment!.investorsVesting!.amounts.map(x => hre.ethers.utils.parseEther(String(x))),
    ],
    log: true,
    autoMine: true,
    waitConfirmations: 1,
  });

  const total = config.deployment!.investorsVesting!.amounts.reduce(
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
func.tags = ["InvestorsVesting"];
module.exports.dependencies = ["FluenceToken"];
