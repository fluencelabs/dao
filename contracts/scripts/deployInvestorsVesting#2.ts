import { ethers, defender } from "hardhat";
import { YEAR, waitAndReturnAddress } from "../deploy/utils";

async function main(token: string) {
  const deployApprovalProcess = await defender.getDeployApprovalProcess();
  if (deployApprovalProcess.address === undefined) {
    throw new Error(
      `Upgrade approval process with id ${deployApprovalProcess.approvalProcessId} has no assigned address`
    );
  }

  console.log("Deploying Investors Vesting #2...");

  const deployment = await defender.deployContract(
    await ethers.getContractFactory("Vesting"),
    [
      token,
      "Fluence Investors Vesting #1",
      "IVFLT#1",
      YEAR,
      YEAR,
      ["sep:0x198691769280d07706a9c85B30565E928F8A9025"],
      "1000000",
    ]
  );

  const address = await waitAndReturnAddress(deployment);
  console.log(`Deploying Investors Vesting #2 address ${address}\n`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main("").catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
