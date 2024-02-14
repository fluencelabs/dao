import { ethers, upgrades, deployments } from "hardhat";
import { YEAR, parseVestingAddresses, waitAndReturnAddress } from "../deploy/utils";

async function main(token: string) {
  console.log("Deploying Team Vesting...");

  const { accounts, amounts } =
    await parseVestingAddresses("./teamVesting.csv");

    await deployments.
  const deployment = await upgrades.deployImplementation(
    await ethers.getContractFactory("VestingWithVoting"),
    {
      constructorArgs: [
        token,
        "Fluence Team Vesting",
        "TVFLT",
        YEAR,
        YEAR,
        accounts,
        amounts,
      ],
      unsafeAllow: ["constructor"],
    }
  );

  const address = await waitAndReturnAddress(deployment);
  console.log(`Team vesting address ${address}\n`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main("0xC93122C19AB99DaF7f6E13777687D88605001B5D").catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
