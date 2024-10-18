import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

// Constants
const WALLETS_JSON_PATH = path.join(__dirname, "wallets.json");
const ERC20_ADDRESS = "0x1303F139FEac224ff877e6071C782A41C30F3255"; // The token address
const MULTI_SEND_ADDRESS = "0xA23bF6504798E092123618baeaceB869149DDA85"; // Address of the deployed multi-send contract

// Configurable parameters
const NUMBER_OF_WALLETS = 1; // Number of wallets to send tokens to
const TOKEN_AMOUNT_PER_WALLET = "1"; // Amount of tokens to send per wallet (in whole units)

async function generateWallets(numberOfWallets: number) {
  if (fs.existsSync(WALLETS_JSON_PATH)) {
    console.log("Loading wallets from file...");
    const wallets = JSON.parse(fs.readFileSync(WALLETS_JSON_PATH, "utf8"));
    return wallets.slice(0, numberOfWallets);
  }

  console.log(`Generating ${numberOfWallets} wallets...`);
  const wallets = [];
  for (let i = 0; i < numberOfWallets; i++) {
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
  const wallets = await generateWallets(NUMBER_OF_WALLETS);
  const recipients = wallets.map((w: any) => w.address);
  const tokenDecimals = 18; // Set manually to expected decimals of the token
  const tokenAmount = ethers.utils.parseUnits(TOKEN_AMOUNT_PER_WALLET, tokenDecimals);

  // Create an array of token amounts for each recipient
  const amounts = Array(NUMBER_OF_WALLETS).fill(tokenAmount);

  console.log(`Transferring ${TOKEN_AMOUNT_PER_WALLET} tokens to each of ${NUMBER_OF_WALLETS} wallets...`);

  // Prepare the data for the multiSend function
  const data = multiSend.interface.encodeFunctionData("multiSendToken", [
    ERC20_ADDRESS,
    recipients,
    amounts,
  ]);

  // Estimate gas for the transaction
  const estimatedGas = await provider.estimateGas({
    to: MULTI_SEND_ADDRESS,
    data: data,
  });

  console.log(`Estimated Gas: ${estimatedGas.toString()}`);

  // Perform the batch transfer using the multi-send contract
  const tx = await multiSend.multiSendToken(ERC20_ADDRESS, recipients, amounts, {
    gasLimit: estimatedGas.mul(120).div(100), // add a 20% buffer
  });
  const receipt = await tx.wait();

  console.log(`Transaction Hash: ${receipt.transactionHash}`);
  console.log(`Actual Gas Used: ${receipt.gasUsed.toString()}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});
