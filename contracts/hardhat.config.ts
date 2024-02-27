import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-solhint";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-deploy";
import "hardhat-tracer";
import "hardhat-docgen";
import "dotenv/config";
import { HardhatUserConfig, task } from "hardhat/config";
import { Config } from "./utils/config";
import "hardhat-contract-sizer";
import "dotenv/config";
import fs from "fs";
import YAML from "yaml";

let config: Config | null = null;
try {
  const file = fs.readFileSync("./config.yaml", "utf8");
  const c = YAML.parse(file);
  config = Config.get(c.networks, c.deployment, c.fluenceMultisig);
} catch (e) {
  console.log("No config file found");
}

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const hardhatConfig: HardhatUserConfig = {
  networks: {
    hardhat: {
      forking: {
        url:
          config?.networks?.mainnet?.url == null
            ? process.env.MAINNET_ETHEREUM_URL!
            : config!.networks!.mainnet!.url,
        blockNumber: 19021757,
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/0f778ddd63a942a6bfdb713f85482055",
      // accounts: [process.env.PRIVATE_KEY as string],
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    mainAccount: {
      default: 4,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  gasReporter: {
    enabled: config?.networks?.repotGas ?? true,
    currency: "USDT",
  },
  etherscan: {
    apiKey: config?.networks?.etherscanApiKey ?? "",
  },
  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY,
    },
  },
};

export default hardhatConfig;
