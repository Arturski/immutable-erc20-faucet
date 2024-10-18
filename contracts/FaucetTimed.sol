// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract ERC20Faucet {
    IERC20 public token; // ERC20 token that this faucet will dispense
    address public owner; // Owner of the faucet
    uint256 public claimAmount; // Amount of tokens to dispense per claim
    uint256 public claimInterval; // Interval between claims in seconds

    // Track last claimed timestamp for each user
    mapping(address => uint256) public lastClaimed;

    // Events for tracking updates
    event TokenUpdated(address indexed newToken);
    event ClaimAmountUpdated(uint256 newAmount);
    event ClaimIntervalUpdated(uint256 newInterval);
    event TokensClaimed(address indexed claimant, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(IERC20 _token, uint256 _claimAmount, uint256 _claimInterval) {
        owner = msg.sender;
        token = _token;
        claimAmount = _claimAmount;
        claimInterval = _claimInterval;
    }

    // Claim tokens from the faucet
    function claim() external {
        require(block.timestamp >= lastClaimed[msg.sender] + claimInterval, "You can only claim once every claim interval");
        require(token.balanceOf(address(this)) >= claimAmount, "Not enough tokens in the faucet");

        // Update last claimed time
        lastClaimed[msg.sender] = block.timestamp;

        // Transfer tokens to the caller
        require(token.transfer(msg.sender, claimAmount), "Token transfer failed");

        emit TokensClaimed(msg.sender, claimAmount);
    }

    // Update the ERC20 token address
    function updateToken(IERC20 _newToken) external onlyOwner {
        token = _newToken;
        emit TokenUpdated(address(_newToken));
    }

    // Update the claim amount
    function updateClaimAmount(uint256 _newAmount) external onlyOwner {
        claimAmount = _newAmount;
        emit ClaimAmountUpdated(_newAmount);
    }

    // Update the claim interval
    function updateClaimInterval(uint256 _newInterval) external onlyOwner {
        claimInterval = _newInterval;
        emit ClaimIntervalUpdated(_newInterval);
    }

    // Allow the owner to withdraw tokens from the contract
    function withdrawTokens(uint256 _amount) external onlyOwner {
        require(token.transfer(msg.sender, _amount), "Token transfer failed");
    }

    // Allow the contract to receive ETH (in case owner wants to fund it for gas fees)
    receive() external payable {}
}
