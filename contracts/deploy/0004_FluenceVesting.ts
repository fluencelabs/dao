import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { MONTH } from "../utils/time";
import { Config } from "../utils/config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const config = Config.get();

  const vesting = await hre.deployments.deploy("FluenceVesting", {
    from: deployer,
    contract: "Vesting",
    args: [
      (await hre.deployments.get("FluenceToken")).address,
      "Fluence Vesting",
      "FLTFV",
      Math.floor(
        config.deployment!.fluenceVesting!.delayDurationMonths * MONTH
      ),
      Math.floor(
        config.deployment!.fluenceVesting!.vestingDurationMonths * MONTH
      ),
      [config.deployment!.fluenceVesting!.account],
      [
        hre.ethers.utils.parseEther(
          String(config.deployment!.fluenceVesting!.amount)
        ),
      ],
    ],
    log: true,
    autoMine: true,
    waitConfirmations: 1,
  });

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
      String(config.deployment!.fluenceVesting!.amount)
    )
  );
};

export default func;
func.tags = ["FluenceVesting", "testnet"];
module.exports.dependencies = ["FluenceToken"];
