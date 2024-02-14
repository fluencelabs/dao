import { ethers } from "hardhat";
import fs from "fs/promises";

export async function parseVestingAddresses(filePath: string) {
  const csvData = await fs.readFile(filePath, "utf-8");
  const rows = csvData.split("\n");

  const accounts = [];
  const amounts = [];
  let totalAmount = 0n;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].split(",");
    const account = row[0];
    const ethersAmount = row[1];
    const amount = ethers.parseEther(ethersAmount);

    accounts.push(account);
    amounts.push(amount.toString());

    totalAmount += amount;

    console.log(
      `Account: ${account}, Amount: ${ethersAmount} FLT (${amount.toString()})`
    );
  }

  console.log(`Total amount ${ethers.formatEther(totalAmount)}`);

  return { accounts, amounts, totalAmount };
}

export async function waitAndReturnAddress(deployment: any): Promise<string> {
  await deployment.waitForDeployment();
  return await deployment.getAddress();
}
