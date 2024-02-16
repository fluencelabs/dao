// import { HardhatRuntimeEnvironment } from "hardhat/types";
// import { DeployFunction } from "hardhat-deploy/types";
// import "hardhat-deploy";
// import { parseVestingAddresses } from "../utils/utils";
// import { HOURS } from "../utils/time";
// import { ethers } from "hardhat";

// const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
//   console.log("\nDeploying Investors Vesting #1...");
//   const deployer = (await ethers.getSigners())[0].address;

//   const { accounts, amounts, totalAmount } = await parseVestingAddresses(
//     "./investorsVesting.csv"
//   );

//   const token = await hre.deployments.get("FluenceToken");

//   const deployResult = await hre.deployments.deploy("InvestorVesting", {
//     from: deployer,
//     contract: "Vesting",
//     args: [
//       token.address,
//       "Fluence Token (Locked)",
//       "FLT-L #20",
//       1 * HOURS,
//       20 * HOURS,
//       accounts,
//       amounts,
//     ],
//     waitConfirmations: 1,
//   });

//   console.log(`Investors Vesting #1 deployed to ${deployResult.address}\n`);

//   await hre.deployments.execute(
//     "FluenceToken",
//     { from: deployer, log: true },
//     "transfer",
//     deployResult.address,
//     totalAmount
//   );
// };

// export default func;
// func.tags = ["InvestorsVesting#1", "mainnet"];
// func.dependencies = ["FluenceToken"];
