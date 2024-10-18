import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// Constants
const WALLETS_JSON_PATH = path.join(__dirname, "wallets100k.json"); // Path to wallets JSON file
const LOG_FILE_PATH = path.join(__dirname, "batch_transfer_max_log.csv");
const ERC20_ADDRESS = "0x1303F139FEac224ff877e6071C782A41C30F3255"; // The token address
const MULTI_SEND_ADDRESS = "0xA23bF6504798E092123618baeaceB869149DDA85"; // Address of the deployed multi-send contract
const INITIAL_BATCH_SIZE = 100; // Start with a batch size of 100
const BATCH_INCREMENT = 100; // Increment batch size by 100 each iteration

// Load wallets from file
async function loadWallets() {
  if (!fs.existsSync(WALLETS_JSON_PATH)) {
    throw new Error("Wallets JSON file not found!");
  }

  console.log("Loading wallets from file...");
  const wallets = JSON.parse(fs.readFileSync(WALLETS_JSON_PATH, "utf8"));
  return wallets;
}

// Function to estimate gas directly using contract method
async function estimateGasForMultiSend(multiSend: any, tokenAddress: string, recipients: string[], amounts: string[]) {
  try {
    console.log(`Estimating gas for sending tokens to ${recipients.length} recipients...`);
    const gasEstimate = await multiSend.estimateGas.multiSendToken(tokenAddress, recipients, amounts);
    console.log(`Estimated Gas for sending tokens: ${gasEstimate.toString()}`);
    return gasEstimate;
  } catch (error) {
    console.error("Error estimating gas for multi-send:", error);
    throw error;
  }
}

// Main function
async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://rpc.testnet.immutable.com");
  const senderPrivateKey = process.env.PRIVATE_KEY!;
  const senderWallet = new ethers.Wallet(senderPrivateKey, provider);

  // Load the MultiSender contract
  const multiSend = await ethers.getContractAt("MultiSender", MULTI_SEND_ADDRESS, senderWallet);

  const wallets = await loadWallets();
  const tokenDecimals = 18;
  const tokenAmount = ethers.utils.parseUnits("0.001", tokenDecimals); // 1 whole token

  const logStream = fs.createWriteStream(LOG_FILE_PATH, { flags: "a" });
  logStream.write(`Batch Size,Estimated Gas,Actual Gas Used,Error\n`);

  let batchSize = INITIAL_BATCH_SIZE;

  while (batchSize <= wallets.length) {
    const recipients = wallets.slice(0, batchSize).map((w: any) => w.address);
    const amounts = Array(batchSize).fill(tokenAmount);

    console.log(`Transferring tokens to ${recipients.length} recipients in a batch...`);

    // Estimate gas for the transaction
    let estimatedGas;
    try {
      estimatedGas = await estimateGasForMultiSend(multiSend, ERC20_ADDRESS, recipients, amounts);
    } catch (error) {
      logStream.write(`${batchSize},N/A,N/A,Gas estimation failed: ${error.message}\n`);
      console.error("Stopping execution due to gas estimation error.");
      break;
    }

    // Perform the batch transfer using the multi-send contract
    try {
      const tx = await multiSend.multiSendToken(ERC20_ADDRESS, recipients, amounts, {
        gasLimit: estimatedGas,
        maxPriorityFeePerGas: ethers.utils.parseUnits("15", "gwei"), // Adjusted priority fee
        maxFeePerGas: ethers.utils.parseUnits("50", "gwei"), // Adjusted max fee
      });

      const receipt = await tx.wait();
      console.log(
        `Batch Size: ${batchSize}, Estimated Gas: ${estimatedGas.toString()}, Actual Gas Used: ${receipt.gasUsed.toString()}`
      );
      logStream.write(`${batchSize},${estimatedGas.toString()},${receipt.gasUsed.toString()},Success\n`);
    } catch (error) {
      console.error(`Error during batch transfer for size ${batchSize}:`, error);
      logStream.write(`${batchSize},${estimatedGas.toString()},N/A,Transaction failed: ${error.message}\n`);
      break;
    }

    // Increment the batch size for the next iteration
    batchSize += BATCH_INCREMENT;
  }

  logStream.end();
  console.log("Batch transfer process completed.");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});
