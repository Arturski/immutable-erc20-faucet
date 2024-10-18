import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
import "hardhat-dependency-compiler";

import * as dotenv from "dotenv";

dotenv.config();

const blockScoutAPIKeyTestnet = process.env.BLOCKSCOUT_API_KEY_TESTNET || "";
const blockScoutAPIKeyMainnet = process.env.BLOCKSCOUT_API_KEY_MAINNET || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  dependencyCompiler: {
    paths: ["@imtbl/contracts/contracts/allowlist/OperatorAllowlistEnforced.sol"],
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    immutableZkevmTestnet: {
      url: "https://rpc.testnet.immutable.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      allowUnlimitedContractSize: true,
    },
  },
  etherscan: {
    apiKey: {
      immutableZkevmTestnet: blockScoutAPIKeyTestnet,
      immutableZkevmMainnet: blockScoutAPIKeyMainnet
    },
    customChains: [
      {
        network: "immutableZkevmTestnet",
        chainId: 13473,
        urls: {
          apiURL: "https://explorer.testnet.immutable.com/api",
          browserURL: "https://explorer.testnet.immutable.com"
        }
      },
      {
        network: "immutableZkevmMainnet",
        chainId: 13371,
        urls: {
          apiURL: "https://explorer.immutable.com/api",
          browserURL: "https://explorer.immutable.com"
        }
      }
    ]
  },
};

export default config;
