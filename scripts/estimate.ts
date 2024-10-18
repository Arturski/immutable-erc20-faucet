import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// Constants
const WALLETS_JSON_PATH = path.join(__dirname, "wallets.json");
const BATCH_SIZE = 10;
const CLAIMABLE_AMOUNT = ethers.utils.parseUnits("0.1", 18); // 0.1 tokens
const ERC20_FAUCET_ADDRESS = "0x51680700c20B0520783D0A398D905dc1AA612061"; // Address of the deployed faucet contract

async function loadWallets() {
  if (fs.existsSync(WALLETS_JSON_PATH)) {
    console.log("Loading wallets from file...");
    const wallets = JSON.parse(fs.readFileSync(WALLETS_JSON_PATH, "utf8"));
    return wallets;
  } else {
    throw new Error("Wallets JSON file not found!");
  }
}

// Function to dynamically estimate gas for a transaction
const estimateGas = async (
  provider: ethers.providers.JsonRpcProvider,
  from: string,
  to: string,
  data: string
): Promise<{ gasLimit: number; maxPriorityFeePerGas: number; maxFeePerGas: number }> => {
  try {
    console.log(`Estimating gas for transaction from ${from} to ${to}`);
    const gasEstimate = await provider.send('eth_estimateGas', [
      {
        from,
        to,
        data,
      },
      'latest',
    ]);

    const gasLimit = parseInt(gasEstimate, 16);
    const maxPriorityFeePerGas = ethers.utils.parseUnits('25', 'gwei');
    const maxFeePerGas = ethers.utils.parseUnits('75', 'gwei');

    return {
      gasLimit: Math.ceil(gasLimit * 1.2), // adding a buffer of 20%
      maxPriorityFeePerGas,
      maxFeePerGas,
    };
  } catch (error) {
    console.error('Error estimating gas:', error);
    throw error;
  }
};

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://rpc.testnet.immutable.com");
  const admin = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  // Verify admin address
  console.log(`Admin address: ${admin.address}`);

  // Load the ERC20 faucet contract with the admin account
  console.log(`Loading faucet contract at ${ERC20_FAUCET_ADDRESS}`);
  const faucet = await ethers.getContractAt("WhitelistERC20Faucet", ERC20_FAUCET_ADDRESS, admin);

  // Check if admin is the owner
  const owner = await faucet.owner();
  console.log(`Faucet contract owner: ${owner}`);
  if (owner.toLowerCase() !== admin.address.toLowerCase()) {
    throw new Error("Admin is not the owner of the faucet contract.");
  }

  // Load wallets
  const wallets = await loadWallets();

  // Get a batch of wallets
  const batchWallets = wallets.slice(0, BATCH_SIZE);
  const addresses = batchWallets.map((w: any) => w.address);
  const amounts = Array(batchWallets.length).fill(CLAIMABLE_AMOUNT);

  console.log(`Addresses: ${addresses.join(",")}`);
  console.log(`Amounts: ${amounts.join(",")}`);

  // Prepare the data for adding the batch to estimate gas
  const addBatchData = faucet.interface.encodeFunctionData("setClaimableAmounts", [addresses, amounts]);

  // Estimate gas for adding the current batch
  try {
    const estimatedGas = await estimateGas(provider, admin.address, faucet.address, addBatchData);
    console.log(`Estimated Gas for adding batch: ${estimatedGas.gasLimit}`);
  } catch (error) {
    console.error('Failed to estimate gas for adding batch:', error);
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});
