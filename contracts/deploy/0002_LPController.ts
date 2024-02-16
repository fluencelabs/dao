import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { ethers } from "hardhat";
import { DAY } from "../utils/time";
import { Config } from "../utils/config";
import { BigNumber } from "ethers";
import { IERC20Metadata__factory } from "../typechain";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const config = Config.get();
  const executorAddress = (await hre.deployments.get("Executor")).address;

  const usdTokenAddress =
    config.deployment!.contracts!.usdToken ??
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const usdToken = IERC20Metadata__factory.connect(
    usdTokenAddress,
    hre.ethers.provider
  );

  let lbpConfigs = new Array(
    {
      token: (await hre.deployments.get("FluenceToken")).address,
      weight: ethers.utils.parseEther(
        String(config.deployment!.pool!.flt.weight)
      ),
      endWeight: ethers.utils.parseEther(
        String(config.deployment!.pool!.flt.endWeight)
      ),
      initialAmount: ethers.utils.parseEther(
        String(config.deployment!.pool!.flt.initialAmount)
      ),
    },
    {
      token: usdTokenAddress,
      weight: ethers.utils.parseEther(
        String(config.deployment!.pool!.usd.weight)
      ),
      endWeight: ethers.utils.parseEther(
        String(config.deployment!.pool!.usd.endWeight)
      ),
      initialAmount: ethers.utils.parseUnits(
        String(config.deployment!.pool!.usd.initialAmount),
        Number(await usdToken.decimals())
      ),
    }
  );

  lbpConfigs = lbpConfigs.sort((a, b) =>
    BigNumber.from(a.token).gt(BigNumber.from(b.token)) ? 1 : -1
  );

  const lbpController = await hre.deployments.deploy("LPController", {
    from: deployer,
    args: [
      config.deployment!.contracts!.balancerLBPFactory ??
        "0x0F3e0c4218b7b0108a3643cFe9D3ec0d4F57c54e",
      config.deployment!.contracts!.uniswapFactory ??
        "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      config.deployment!.contracts!.uniswapNFTManager ??
        "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
      config.deployment!.contracts!.balancerVault ??
        "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      executorAddress,
      lbpConfigs[0].token,
      lbpConfigs[1].token,
    ],
    log: true,
    autoMine: true,
    waitConfirmations: 1,
  });

  for (const config of lbpConfigs) {
    const token = IERC20Metadata__factory.connect(
      config.token,
      await hre.ethers.getSigner(deployer)
    );
    const tx = await token.approve(lbpController.address, config.initialAmount);

    await tx.wait();
  }

  await hre.deployments.execute(
    "LPController",
    {
      from: deployer,
      log: true,
      autoMine: true,
      waitConfirmations: 1,
    },
    "createBalancerLBP",
    lbpConfigs.map((x) => x.weight),
    lbpConfigs.map((x) => x.endWeight),
    lbpConfigs.map((x) => x.initialAmount),
    BigNumber.from(config.deployment!.pool!.lbpPoolDurationDays * DAY),
    ethers.utils.parseUnits(
      String(config.deployment!.pool!.swapFeePercentage),
      16
    )
  );
};

export default func;
func.tags = ["LPController", "testnet"];
module.exports.dependencies = ["FluenceToken", "Executor"];
