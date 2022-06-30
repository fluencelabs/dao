import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { Config } from "../utils/config";
import { parse } from 'csv-parse/sync';
import { BigNumber, BigNumberish, ethers } from "ethers";
import fs from 'fs'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const config = Config.get();

  let accounts: Array<string> = [];
  let amounts: Array<BigNumber> = [];

  if (config!.deployment?.investorsVesting?.csvFile != null) {
    const file = fs.readFileSync(config!.deployment!.investorsVesting!.csvFile, 'utf8')

    const records = parse(file, {
      skip_empty_lines: true
    });

    accounts = records.map(r => r[0]);
    amounts = records.map(r => ethers.utils.parseEther(r[1]));
  } else {
    accounts = config!.deployment!.investorsVesting!.accounts;
    amounts = config!.deployment!.investorsVesting!.amounts.map(a => ethers.utils.parseEther(String(a)));
  }

  const vesting = await hre.deployments.deploy("InvestorsVesting", {
    from: deployer,
    contract: "Vesting",
    args: [
      (await hre.deployments.get("FluenceToken")).address,
      config.deployment!.investorsVesting!.cliffDurationMonths,
      config.deployment!.investorsVesting!.vestingDurationMonths,
      accounts,
      amounts,
      1
    ],
    log: true,
    autoMine: true,
    waitConfirmations: 1,
  });

  const total = amounts.reduce(
    (previousValue: BigNumber, currentValue: BigNumber) => previousValue.add(currentValue),
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
func.tags = ["InvestorsVesting"];
module.exports.dependencies = ["FluenceToken"];
