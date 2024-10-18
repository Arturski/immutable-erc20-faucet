# zkEVM Boilerplate

This repository contains a boilerplate Hardhat project for Immutable zkEVM smart contract development in Solidity. It is intended to bootstrap the development of Immutable zkEVM-compatible smart contracts for developers of all skill levels.

It contains a few examples of how to extend the Immutable Presets [`@imtbl/contracts`](https://github.com/immutable/contracts) package, as well as example test cases and a deployment script to help you get started.

For more information and guides, please refer to our [smart contract developer documentation](https://docs.immutable.com/docs/zkEVM/deploy-contracts).

## How to use

Fork this repository and clone it to your local machine.
See the [Github docs](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) for a guide to forking a repository.

Create a file called `.env` by copying the `.env.sample` file.

Fill in the value for the `PRIVATE_KEY=` with your deployer wallet's private key.

Run `yarn` to install the required dependencies.

There are a few pre-defined scripts that you can run to compile, test, and deploy your contracts:

```
"scripts": {
    "clean": "npx hardhat clean",
    "test": "npx hardhat test",
    "compile": "npx hardhat compile",
    "deploy:erc721:zkevm": "npx hardhat run scripts/erc721deploy.ts --network immutableZkevmTestnet",
    "deploy:erc1155:zkevm": "npx hardhat run scripts/erc1155deploy.ts --network immutableZkevmTestnet",
    "deploy:erc20:zkevm": "npx hardhat run scripts/erc20deploy.ts --network immutableZkevmTestnet",
    "deploy:by-id:zkevm": "npx hardhat run scripts/by-id/deploy.ts --network immutableZkevmTestnet"
  },
```

## Verifying contracts on the block explorer

The `hardhat.config.ts` file is already pre-configured to support verifying contracts on the Immutable zkEVM Testnet and Mainnet.

In order to verify the source code of your contract on the Immutable Block explorers, you will need to sign up for an account on the Immutable Block Explorer (https://explorer.testnet.immutable.com) and get an API key and add it to to your `.env` under the entry `BLOCKSCOUT_API_KEY_TESTNET=` or `BLOCKSCOUT_API_KEY_MAINNET=` depending on which network you're verifying the contract contract

To verify the MyERC1155.sol contract, the command would be:

`npx hardhat verify --contract contracts/MyERC1155.sol:MyERC1155 --network immutableZkevmTestnet 0x759A390CE23Fb422b396B51BdD57b545A440D9F2 0x394655BBeA70eB605F1a55Ab954a6Ab393a7e82a "Imaginary Immutable Iguanas" "https://example-base-uri.com/" "https://example-contract-uri.com/" 0x02Ada708Db37470F6707075Cbdc7bD295d30B25E 0x394655BBeA70eB605F1a55Ab954a6Ab393a7e82a 2000`

Let's break that command down:

- The `---contract` named argument specifies which contract needs to be verified
- The `--network` name argument specifies which network the contract is on.
- The first argument is the address of the contract you're verifying. 
- All the subsequent arguments are the constructor arguments that you used when deploying the contract. 


