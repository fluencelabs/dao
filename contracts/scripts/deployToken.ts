import { ethers, upgrades } from "hardhat";
import { waitAndReturnAddress } from "../deploy/utils";

async function main() {
  console.log("Deploying Fluence Token...");

  const deployment = await upgrades.deployProxy(
    await ethers.getContractFactory("FluenceToken"),
    ["Fluence", "FLT", ethers.parseEther("1000000000")],
    { initializer: "initialize" }
  );

  const fluenceTokenAddress = await waitAndReturnAddress(deployment);
  console.log(`FLT token deployed to ${fluenceTokenAddress}\n`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
