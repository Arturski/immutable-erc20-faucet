import { ethers } from "hardhat";

// Constants
const ERC20_ADDRESS = "0x1303F139FEac224ff877e6071C782A41C30F3255"; // ERC20 token address
const MULTI_SEND_ADDRESS = "0xA23bF6504798E092123618baeaceB869149DDA85"; // Address of the MultiSender contract
const TOTAL_APPROVAL_AMOUNT = ethers.utils.parseUnits("1000000", 18); // Total amount to approve (adjust as needed)

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Approving tokens with the account:", deployer.address);

  // Use the fully qualified name for IERC20
  const erc20 = await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    ERC20_ADDRESS,
    deployer
  );

  // Approve the MultiSender contract to spend the specified amount of tokens
  const tx = await erc20.approve(MULTI_SEND_ADDRESS, TOTAL_APPROVAL_AMOUNT);
  console.log("Approval transaction hash:", tx.hash);
  await tx.wait();

  console.log(`Approved ${TOTAL_APPROVAL_AMOUNT.toString()} tokens for MultiSender contract.`);
}

main().catch((error) => {
  console.error("Error during approval:", error);
  process.exitCode = 1;
});
