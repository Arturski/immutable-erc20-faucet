# Immutable zkEVM — Timed ERC20 Faucet

A simple, self-contained **ERC20 faucet** smart contract for [Immutable zkEVM](https://www.immutable.com/zkEVM), built with Hardhat. It dispenses a fixed amount of an ERC20 token per address, rate-limited to one claim per configurable interval — handy for funding test wallets on testnet.

## Contract

[`contracts/FaucetTimed.sol`](contracts/FaucetTimed.sol) — `ERC20Faucet`:

- **`claim()`** — sends `claimAmount` tokens to the caller, once per `claimInterval` seconds (per address).
- **Owner controls** — `updateToken`, `updateClaimAmount`, `updateClaimInterval`, and `withdrawTokens`.
- **Events** — `TokensClaimed`, `TokenUpdated`, `ClaimAmountUpdated`, `ClaimIntervalUpdated`.

Constructor: `(IERC20 token, uint256 claimAmount, uint256 claimInterval)`. Fund the deployed faucet by transferring the ERC20 token to its address.

> ⚠️ Educational / testnet example. Not audited — do not use with real funds without a security review.

## Setup

```bash
yarn install
cp .env.example .env   # then fill in PRIVATE_KEY (deployer) and, optionally, a Blockscout API key
```

| Variable | Purpose |
| --- | --- |
| `PRIVATE_KEY` | Deployer wallet private key |
| `BLOCKSCOUT_API_KEY_TESTNET` | API key for verifying on the testnet explorer (optional) |
| `BLOCKSCOUT_API_KEY_MAINNET` | API key for verifying on the mainnet explorer (optional) |

## Scripts

```bash
yarn compile          # compile the contract
yarn test             # run tests
yarn deploy:zkevm     # deploy to Immutable zkEVM Testnet (scripts/deploy.ts)
```

Edit the reward-token address, claim amount, and interval at the top of [`scripts/deploy.ts`](scripts/deploy.ts) before deploying.

## Verifying on the block explorer

`hardhat.config.ts` is pre-configured for the Immutable zkEVM Testnet and Mainnet Blockscout explorers. Get an API key from [explorer.testnet.immutable.com](https://explorer.testnet.immutable.com), add it as `BLOCKSCOUT_API_KEY_TESTNET`, then verify with the contract address and the exact constructor args used at deploy time:

```bash
npx hardhat verify --contract contracts/FaucetTimed.sol:ERC20Faucet \
  --network immutableZkevmTestnet <FAUCET_ADDRESS> <TOKEN_ADDRESS> <CLAIM_AMOUNT> <CLAIM_INTERVAL>
```

## License

[MIT](LICENSE)
