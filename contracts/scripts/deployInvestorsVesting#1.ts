import { ethers, defender } from "hardhat";
import {
  YEAR,
  parseVestingAddresses,
  waitAndReturnAddress,
} from "../utils/utils";

async function main(token: string) {
  const deployApprovalProcess = await defender.getDeployApprovalProcess();
  if (deployApprovalProcess.address === undefined) {
    throw new Error(
      `Upgrade approval process with id ${deployApprovalProcess.approvalProcessId} has no assigned address`
    );
  }

  console.log("Deploying Investors Vesting #1...");

  const { accounts, amounts } = await parseVestingAddresses(
    "./investorsVesting.csv"
  );

  const deployment = await defender.deployContract(
    await ethers.getContractFactory("Vesting"),
    [token, "Fluence Investors Vesting #2", "IVFLT#1", 0, 0, accounts, amounts],
    {
      unsafeAllowDeployContract: true,
      useDefenderDeploy: true,
    }
  );

  const address = await waitAndReturnAddress(deployment);
  console.log(`Deploying Investors Vesting #1 address ${address}\n`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main("0x93BE607c36f0D62f910d6418697c3D82893f271f").catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
