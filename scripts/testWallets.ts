import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// Constants
const WALLETS_JSON_PATH = path.join(__dirname, "wallets.json");
const LOG_CSV_PATH = path.join(__dirname, "scaling_test_log.csv");
const BATCH_SIZE = 1000;
const CLAIMABLE_AMOUNT = ethers.utils.parseUnits("0.1", 18); // 0.1 tokens
const ERC20_FAUCET_ADDRESS = "0x848aA4fC04ABD75Eea29909e316B3E3c1c6edA31"; // Address of the deployed faucet contract
const NATIVE_TOKEN_TRANSFER_AMOUNT = ethers.utils.parseEther("0.01"); // Amount of native token (IMX) to fund the wallet

async function loadWallets() {
  if (fs.existsSync(WALLETS_JSON_PATH)) {
    console.log("Loading wallets from file...");
    const wallets = JSON.parse(fs.readFileSync(WALLETS_JSON_PATH, "utf8"));
    return wallets;
  } else {
    throw new Error("Wallets JSON file not found!");
  }
}

// Function to estimate gas for adding a batch
async function estimateGasForAdd(faucet: any, addresses: string[], amounts: string[], adminAddress: string) {
  try {
    console.log(`Estimating gas for adding ${addresses.length} wallets...`);
    const gasEstimate = await faucet.estimateGas.setClaimableAmounts(addresses, amounts, { from: adminAddress });
    console.log(`Estimated Gas for adding batch: ${gasEstimate.toString()}`);
    return gasEstimate;
  } catch (error) {
    console.error("Error estimating gas for add:", error);
    throw error;
  }
}

// Function to estimate gas for a claim
async function estimateGasForClaim(faucet: any, wallet: any) {
  try {
    console.log(`Estimating gas for wallet ${wallet.address} to claim tokens...`);
    const gasEstimate = await faucet.connect(wallet).estimateGas.claim();
    console.log(`Estimated Gas for claiming tokens: ${gasEstimate.toString()}`);
    return gasEstimate;
  } catch (error) {
    console.error("Error estimating gas for claim:", error);
    throw error;
  }
}

// Function to fund a wallet with native token
async function fundWallet(sender: any, recipient: string) {
  console.log(`Funding wallet ${recipient} with native tokens...`);
  const tx = await sender.sendTransaction({
    to: recipient,
    value: NATIVE_TOKEN_TRANSFER_AMOUNT,
    maxPriorityFeePerGas: ethers.utils.parseUnits("10", "gwei"),
    maxFeePerGas: ethers.utils.parseUnits("40", "gwei"),
  });
  await tx.wait();
  console.log(`Funded wallet ${recipient}`);
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://rpc.testnet.immutable.com");
  const admin = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  // Load the ERC20 faucet contract with the admin account
  console.log(`Loading faucet contract at ${ERC20_FAUCET_ADDRESS}`);
  const faucet = await ethers.getContractAt("WhitelistERC20Faucet", ERC20_FAUCET_ADDRESS, admin);

  // Check if admin is the owner
  const owner = await faucet.owner();
  console.log(`Faucet contract owner: ${owner}`);
  console.log(`Admin address: ${admin.address}`);
  if (owner.toLowerCase() !== admin.address.toLowerCase()) {
    throw new Error("Admin is not the owner of the faucet contract.");
  }

  // Load wallets
  const wallets = await loadWallets();

  // Create log stream
  const logStream = fs.createWriteStream(LOG_CSV_PATH, { flags: "a" });
  logStream.write(`Batch Size,Wallet,Estimated Gas (Add),Gas Used (Add),Estimated Gas (Claim),Gas Used (Claim)\n`);

  let totalGasForAddBatches = ethers.BigNumber.from(0);
  let totalGasForClaims = ethers.BigNumber.from(0);

  // Process wallets in batches of BATCH_SIZE
  for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
    const batchWallets = wallets.slice(i, i + BATCH_SIZE);

    // Addresses and claimable amounts for the current batch
    const addresses = batchWallets.map((w: any) => w.address);
    const amounts = Array(batchWallets.length).fill(CLAIMABLE_AMOUNT);

    console.log(`Addresses: ${addresses.join(",")}`);
    console.log(`Amounts: ${amounts.join(",")}`);

    // Estimate gas for adding the current batch
    const estimatedGasForAdd = await estimateGasForAdd(faucet, addresses, amounts, admin.address);

    console.log(`Sending transaction to add batch of ${batchWallets.length} wallets...`);

    // Add current batch to the faucet contract with proper gas limit and higher fees
    let addBatchReceipt;
    try {
      const addBatchTx = await faucet.setClaimableAmounts(addresses, amounts, {
        gasLimit: estimatedGasForAdd,
        maxPriorityFeePerGas: ethers.utils.parseUnits("15", "gwei"), // Increase the priority fee
        maxFeePerGas: ethers.utils.parseUnits("50", "gwei"), // Increase the max fee
      });
      addBatchReceipt = await addBatchTx.wait();
      console.log(`Batch of ${batchWallets.length} wallets added. Gas Used: ${addBatchReceipt.gasUsed.toString()}`);
      totalGasForAddBatches = totalGasForAddBatches.add(addBatchReceipt.gasUsed);
    } catch (error) {
      console.error("Error sending transaction to add batch:", error);
      throw error;
    }

    // Select one wallet from the current batch for testing claim
    const testWalletInfo = batchWallets[0];
    const testWallet = new ethers.Wallet(testWalletInfo.privateKey, provider);

    // Fund the test wallet with native token for gas fees
    await fundWallet(admin, testWallet.address);

    // Estimate gas for the claim function
    const estimatedGasForClaim = await estimateGasForClaim(faucet, testWallet);

    // Claim tokens using the test wallet
    console.log(`Wallet ${testWallet.address} is claiming tokens...`);
    let claimReceipt;
    try {
      const claimTx = await faucet.connect(testWallet).claim({
        gasLimit: estimatedGasForClaim,
        maxPriorityFeePerGas: ethers.utils.parseUnits("15", "gwei"),
        maxFeePerGas: ethers.utils.parseUnits("50", "gwei"),
      });
      claimReceipt = await claimTx.wait();
      console.log(`Claim successful. Gas Used: ${claimReceipt.gasUsed.toString()}`);
      totalGasForClaims = totalGasForClaims.add(claimReceipt.gasUsed);
    } catch (error) {
      console.error("Error claiming tokens:", error);
      throw error;
    }

    // Log data to CSV
    logStream.write(
      `${batchWallets.length},${testWallet.address},${estimatedGasForAdd.toString()},${addBatchReceipt.gasUsed.toString()},${estimatedGasForClaim.toString()},${claimReceipt.gasUsed.toString()}\n`
    );
  }

  logStream.end();

  // Summary
  console.log(`\nSummary:`);
  console.log(`Total Gas Used for Adding Batches: ${totalGasForAddBatches.toString()}`);
  console.log(`Total Gas Used for Claims: ${totalGasForClaims.toString()}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});
