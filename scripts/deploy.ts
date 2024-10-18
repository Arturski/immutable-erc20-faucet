import { ethers, run } from "hardhat";

async function main() {
  // Fetch the deployer account
  const [deployer] = await ethers.getSigners(); // Use ethers from Hardhat
  console.log("Deploying contracts with the account:", deployer.address);

  // Address of the ERC20 token (reward token)
  const RewardTokenAddress: string = "0x1303F139FEac224ff877e6071C782A41C30F3255";

  // 1 Token in the smallest unit (assuming 18 decimals, same as wei)
  const claimAmount = ethers.utils.parseUnits("1", 18);

  // Claim interval (1 day in seconds)
  const claimInterval = 24 * 60 * 60; // 86400 seconds

  // Get the contract factory and deploy
  const ERC20Faucet = await ethers.getContractFactory("ERC20Faucet");
  const erc20Faucet = await ERC20Faucet.deploy(
    RewardTokenAddress, // Address of the ERC20 token
    claimAmount,        // Claim amount (1 token in smallest units)
    claimInterval       // Claim interval (1 day)
  );

  await erc20Faucet.deployed();
  console.log("ERC20Faucet deployed to:", erc20Faucet.address);

  // Constructor arguments used during deployment
  const constructorArguments = [
    RewardTokenAddress,
    claimAmount.toString(), // .toString() is important for verification
    claimInterval
  ];

  // Verify the contract on the blockchain (e.g., Etherscan)
  try {
    console.log("Verifying contract...");
    await run("verify:verify", {
      address: erc20Faucet.address,
      constructorArguments: constructorArguments,
    });
    console.log("Contract verified successfully.");
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
