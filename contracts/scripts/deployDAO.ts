import { ethers, defender } from "hardhat";
import { DAY, waitAndReturnAddress } from "../deploy/utils";

async function main(token: string, teamVesting: string) {
  const deployApprovalProcess = await defender.getDeployApprovalProcess();
  if (deployApprovalProcess.address === undefined) {
    throw new Error(
      `Upgrade approval process with id ${deployApprovalProcess.approvalProcessId} has no assigned address`
    );
  }

  console.log("Deploying DAO...");

  console.log("Deploying Executor...");
  const executorDeployment = await defender.deployProxy(
    await ethers.getContractFactory("Executor"),
    [0],
    { initializer: "initialize" }
  );
  const executorAddress = await waitAndReturnAddress(executorDeployment);

  console.log(`Executor deployed to ${executorAddress}`);

  const daoDeployment = await defender.deployProxy(
    await ethers.getContractFactory("Governor"),
    [
      token,
      teamVesting,
      executorAddress,
      ethers.parseEther("1000"),
      Math.floor((1 * DAY) / 13.14),
      Math.floor((1 * DAY) / 13.14),
      ethers.parseEther("2000"),
    ],
    { initializer: "initialize" }
  );
  const daoAddress = await waitAndReturnAddress(daoDeployment);

  console.log(`DAO deployed to ${daoAddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main("", "").catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
