import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { MONTH } from "../utils/time";
import { Config } from "../utils/config";
import { parse } from "csv-parse/sync";
import { BigNumber, BigNumberish, ethers } from "ethers";
import fs from "fs";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const config = Config.get();

  let accounts: Array<string> = [];
  let amounts: Array<BigNumber> = [];

  if (config!.deployment?.teamVesting?.csvFile != null) {
    const file = fs.readFileSync(
      config!.deployment!.teamVesting!.csvFile,
      "utf8"
    );

    const records = parse(file, {
      skip_empty_lines: true,
    });

    accounts = records.map((r: any) => r[0]);
    amounts = records.map((r: any) => ethers.utils.parseEther(r[1]));
  } else {
    accounts = config!.deployment!.teamVesting!.accounts;
    amounts = config!.deployment!.teamVesting!.amounts.map((a) =>
      ethers.utils.parseEther(String(a))
    );
  }

  const vesting = await hre.deployments.deploy("TeamVesting", {
    from: deployer,
    contract: "VestingWithVoting",
    args: [
      (await hre.deployments.get("FluenceToken")).address,
      "Team Vesting",
      "FLTTV",
      Math.floor(config.deployment!.teamVesting!.delayDurationMonths * MONTH),
      Math.floor(config.deployment!.teamVesting!.vestingDurationMonths * MONTH),
      accounts,
      amounts,
    ],
    log: true,
    autoMine: true,
    waitConfirmations: 1,
  });

  const total = amounts.reduce(
    (previousValue: BigNumber, currentValue: BigNumber) =>
      previousValue.add(currentValue),
    BigNumber.from(0)
  );

  if (!total.isZero()) {
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
      total
    );
  }
};

export default func;
func.tags = ["TeamVesting", "testnet"];
module.exports.dependencies = ["FluenceToken"];
