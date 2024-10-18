import { ethers, run } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Address of the ERC20 token (replace this with the token address you wish to use)
  const RewardTokenAddress: string = "0x1303F139FEac224ff877e6071C782A41C30F3255";

  // Get the contract factory and deploy the WhitelistERC20Faucet contract
  const WhitelistERC20Faucet = await ethers.getContractFactory("WhitelistERC20Faucet");
  const whitelistERC20Faucet = await WhitelistERC20Faucet.deploy(RewardTokenAddress);

  await whitelistERC20Faucet.deployed();
  console.log("WhitelistERC20Faucet deployed to:", whitelistERC20Faucet.address);

  // Constructor arguments used during deployment
  const constructorArguments = [RewardTokenAddress];

  // Verify the contract on the blockchain explorer
  try {
    console.log("Verifying contract...");
    await run("verify:verify", {
      address: whitelistERC20Faucet.address,
      constructorArguments: constructorArguments,
    });
    console.log("Contract verified successfully.");
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});
