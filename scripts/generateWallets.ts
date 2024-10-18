import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Constants
const WALLETS_JSON_PATH = path.join(__dirname, "wallets100k.json");
const NUMBER_OF_WALLETS = 100000; // Adjust this to generate the desired number of wallets

// Function to generate wallets
async function generateWallets() {
  console.log(`Generating ${NUMBER_OF_WALLETS} wallets...`);
  const wallets: { address: string; privateKey: string }[] = [];

  for (let i = 0; i < NUMBER_OF_WALLETS; i++) {
    const wallet = ethers.Wallet.createRandom();
    wallets.push({ address: wallet.address, privateKey: wallet.privateKey });

    // Log progress every 100 wallets
    if ((i + 1) % 100 === 0) {
      console.log(`Generated ${i + 1} wallets...`);
    }
  }

  return wallets;
}

// Function to save wallets to file
async function saveWallets(wallets: { address: string; privateKey: string }[]) {
  fs.writeFileSync(WALLETS_JSON_PATH, JSON.stringify(wallets, null, 2));
  console.log(`Saved ${wallets.length} wallets to ${WALLETS_JSON_PATH}`);
}

async function main() {
  try {
    const wallets = await generateWallets();
    await saveWallets(wallets);
  } catch (error) {
    console.error("Error:", error);
    process.exitCode = 1;
  }
}

main();
