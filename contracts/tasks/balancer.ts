import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy";
import { LPController } from "../typechain";

task("exit", "Exit from LBP", async (taskArgs, hre) => {
    const lpControllerAddress = (await hre.deployments.get("LPController")).address;

    const lpController = (await hre.ethers.getContractAt(
        "LPController",
        lpControllerAddress
    )) as LPController;

    await lpController.exitBalancer()
});

module.exports = {};