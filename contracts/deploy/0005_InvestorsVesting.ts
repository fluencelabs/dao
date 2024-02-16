import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { Config } from "../utils/config";
import { parse } from "csv-parse/sync";
import { BigNumber, BigNumberish, ethers } from "ethers";
import fs from "fs";
import { MONTH } from "../utils/time";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const config = Config.get();

  let accounts: Array<string> = [];
  let amounts: Array<BigNumber> = [];

  if (config!.deployment?.investorsVesting?.csvFile != null) {
    const file = fs.readFileSync(
      config!.deployment!.investorsVesting!.csvFile,
      "utf8"
    );

    const records = parse(file, {
      skip_empty_lines: true,
    });

    accounts = records.map((r: any) => r[0]);
    amounts = records.map((r: any) => ethers.utils.parseEther(r[1]));
  } else {
    accounts = config!.deployment!.investorsVesting!.accounts;
    amounts = config!.deployment!.investorsVesting!.amounts.map((a) =>
      ethers.utils.parseEther(String(a))
    );
  }

  const vesting = await hre.deployments.deploy("InvestorsVesting", {
    from: deployer,
    contract: "Vesting",
    args: [
      (await hre.deployments.get("FluenceToken")).address,
      "Investors Vesting",
      "FLTIV",
      Math.floor(
        config.deployment!.investorsVesting!.delayDurationMonths * MONTH
      ),
      Math.floor(
        config.deployment!.investorsVesting!.vestingDurationMonths * MONTH
      ),
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
func.tags = ["InvestorsVesting", "testnet"];
module.exports.dependencies = ["FluenceToken"];
