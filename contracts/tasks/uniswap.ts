import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";

task("create", "Create liquidity pool", async (taskArgs, hre) => {
    const lpControllerAddress = (await hre.deployments.get("LPController")).address;

    const lpController = (await hre.ethers.getContractAt(
        "LPController",
        lpControllerAddress
    )) as LPController;

    await lpController.createUniswap()
});

module.exports = {};