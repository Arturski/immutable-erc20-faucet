// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract WhitelistERC20Faucet is ReentrancyGuard {
    IERC20 public token; // ERC20 token that this faucet will dispense
    address public owner; // Owner of the faucet

    // Whitelist mapping to store the claimable amounts for each address
    mapping(address => uint256) public claimableAmounts;

    // Events for tracking updates
    event TokenUpdated(address indexed newToken);
    event ClaimableAmountUpdated(address indexed user, uint256 amount);
    event TokensClaimed(address indexed claimant, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(IERC20 _token) {
        owner = msg.sender;
        token = _token;
    }

    // Claim tokens from the faucet if they have a claimable amount
    function claim() external nonReentrant {
        uint256 amount = claimableAmounts[msg.sender];
        require(amount > 0, "No claimable amount");
        require(token.balanceOf(address(this)) >= amount, "Not enough tokens in the faucet");

        // Set the claimable amount to zero
        claimableAmounts[msg.sender] = 0;

        // Transfer tokens to the caller
        require(token.transfer(msg.sender, amount), "Token transfer failed");

        emit TokensClaimed(msg.sender, amount);
    }

    // Add or update claimable amounts for users
    function setClaimableAmount(address user, uint256 amount) external onlyOwner {
        claimableAmounts[user] = amount;
        emit ClaimableAmountUpdated(user, amount);
    }

    // Batch update for multiple users' claimable amounts
    function setClaimableAmounts(address[] calldata users, uint256[] calldata amounts) external onlyOwner {
        require(users.length == amounts.length, "Mismatched arrays");

        for (uint256 i = 0; i < users.length; i++) {
            claimableAmounts[users[i]] = amounts[i];
            emit ClaimableAmountUpdated(users[i], amounts[i]);
        }
    }

    // Update the ERC20 token address
    function updateToken(IERC20 _newToken) external onlyOwner {
        token = _newToken;
        emit TokenUpdated(address(_newToken));
    }

    // Allow the owner to withdraw tokens from the contract
    function withdrawTokens(uint256 _amount) external onlyOwner nonReentrant {
        require(token.transfer(msg.sender, _amount), "Token transfer failed");
    }

    // Allow the contract to receive ETH (in case owner wants to fund it for gas fees)
    receive() external payable {}
}
