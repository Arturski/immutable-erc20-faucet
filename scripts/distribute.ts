import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// Constants
const WALLETS_JSON_PATH = path.join(__dirname, "wallets.json");
const LOG_CSV_PATH = path.join(__dirname, "batch_transfer_log.csv");
const BATCH_SIZES = [100, 200, 300, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000];
const ERC20_ADDRESS = "0x1303F139FEac224ff877e6071C782A41C30F3255"; // The token address
const MULTI_SEND_ADDRESS = "0xA23bF6504798E092123618baeaceB869149DDA85"; // Address of the deployed multi-send contract

// Generate wallets if the JSON file doesn't exist
async function generateWallets() {
  if (fs.existsSync(WALLETS_JSON_PATH)) {
    console.log("Loading wallets from file...");
    return JSON.parse(fs.readFileSync(WALLETS_JSON_PATH, "utf8"));
  }

  console.log("Generating 1,000 wallets...");
  const wallets = [];
  for (let i = 0; i < 1000; i++) {
    const wallet = ethers.Wallet.createRandom();
    wallets.push({
      address: wallet.address,
      privateKey: wallet.privateKey,
    });
  }

  fs.writeFileSync(WALLETS_JSON_PATH, JSON.stringify(wallets, null, 2));
  console.log("Wallets generated and saved to file.");
  return wallets;
}

// Function to estimate gas directly using contract method
async function estimateGasForMultiSend(multiSend: any, tokenAddress: string, recipients: string[], amounts: ethers.BigNumber[]) {
  try {
    console.log(`Estimating gas for sending tokens to ${recipients.length} recipients...`);
    const gasEstimate = await multiSend.estimateGas.multiSendToken(tokenAddress, recipients, amounts);
    console.log(`Estimated Gas for sending tokens: ${gasEstimate.toString()}`);
    return gasEstimate;
  } catch (error) {
    console.error("Error estimating gas for multi-send:", error);
    // Fallback to a default gas limit if estimation fails
    return ethers.BigNumber.from("200000");
  }
}

// Function to approve token spending
async function ensureTokenApproval(erc20: any, spender: string, amount: ethers.BigNumber) {
  const allowance = await erc20.allowance(await erc20.signer.getAddress(), spender);
  if (allowance.lt(amount)) {
    console.log(`Approving ${amount.toString()} tokens for MultiSender contract...`);
    const approveTx = await erc20.approve(spender, amount);
    await approveTx.wait();
    console.log(`Approval successful.`);
  } else {
    console.log(`Sufficient allowance already set.`);
  }
}

// Main function
async function main() {
  const provider = new ethers.providers.JsonRpcProvider("https://rpc.testnet.immutable.com");
  const senderPrivateKey = process.env.PRIVATE_KEY!;
  const senderWallet = new ethers.Wallet(senderPrivateKey, provider);

  // Use the fully qualified name for IERC20 to avoid ambiguity
  const erc20 = await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    ERC20_ADDRESS,
    senderWallet
  );

  // Load the MultiSender contract
  const multiSend = await ethers.getContractAt("MultiSender", MULTI_SEND_ADDRESS, senderWallet);

  // Generate or load wallets
  const wallets = await generateWallets();
  const tokenDecimals = 18;
  const tokenAmount = ethers.utils.parseUnits("1", tokenDecimals); // 1 whole token

  const totalApprovalAmount = ethers.utils.parseUnits("1000000", tokenDecimals); // Total amount to approve
  await ensureTokenApproval(erc20, MULTI_SEND_ADDRESS, totalApprovalAmount);

  const logStream = fs.createWriteStream(LOG_CSV_PATH, { flags: "a" });
  logStream.write(`Batch Size,Estimated Gas,Actual Gas Used\n`);

  for (const batchSize of BATCH_SIZES) {
    const recipients = wallets.slice(0, batchSize).map((w: any) => w.address);
    const amounts = Array(batchSize).fill(tokenAmount);

    console.log(`Transferring ${recipients.length} tokens in a batch...`);

    // Estimate gas for the transaction
    const estimatedGasForMultiSend = await estimateGasForMultiSend(multiSend, ERC20_ADDRESS, recipients, amounts);

    console.log(`Sending transaction to transfer tokens to ${recipients.length} recipients...`);

    // Perform the batch transfer using the multi-send contract
    try {
      const tx = await multiSend.multiSendToken(ERC20_ADDRESS, recipients, amounts, {
        gasLimit: estimatedGasForMultiSend,
        maxPriorityFeePerGas: ethers.utils.parseUnits("20", "gwei"), // Increase the priority fee
        maxFeePerGas: ethers.utils.parseUnits("60", "gwei"), // Increase the max fee
      });

      const receipt = await tx.wait();

      console.log(`Batch Size: ${batchSize}, Estimated Gas: ${estimatedGasForMultiSend.toString()}, Actual Gas Used: ${receipt.gasUsed.toString()}`);
      logStream.write(`${batchSize},${estimatedGasForMultiSend.toString()},${receipt.gasUsed.toString()}\n`);
    } catch (error) {
      console.error(`Error sending transaction for batch size ${batchSize}:`, error);
      // Continue with the next batch instead of throwing
    }
  }

  logStream.end();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});
