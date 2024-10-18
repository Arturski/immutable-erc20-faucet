# NFT Staking on Immutable zkEVM

## FOR EDUCATIONAL USE ONLY

## OVERVIEW

This detailed guide provides instructions for developers to create a simple NFT staking contract on the Immutable zkEVM blockchain. The contract allows users to stake their ERC721 NFTs and earn rewards in an ERC20 token. This example demonstrates how to implement a basic staking mechanism with a rewards system.

## PROCEDURE

1. Create a folder called `nft-staking` and place the `NFTStaking.sol` file there.

2. Deploy your ERC721 NFT contract on the Immutable zkEVM. Make sure you have a deployed ERC20 token for rewards.

3. Install Foundry:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

4. Deploy the NFT Staking contract:
   ```bash
   forge create 
   --rpc-url "https://rpc.testnet.immutable.com" 
   --private-key "<PrivateKey>" 
   nft-staking/NFTStaking.sol:NFTStaking 
   --constructor-args "<NFTContractAddress>", "<RewardTokenAddress>"
   ```

5. Interact with the staking contract:
   - **Stake NFTs**:
     ```bash
     cast send --rpc-url "https://rpc.testnet.immutable.com"    
     --private-key "<PrivateKey>"            
     "<StakingContractAddress>" 
     "stake(uint256)" 
     "<TokenId>"
     ```

   - **Unstake NFTs**:
     ```bash
     cast send --rpc-url "https://rpc.testnet.immutable.com"    
     --private-key "<PrivateKey>"            
     "<StakingContractAddress>" 
     "unstake(uint256)" 
     "<TokenId>"
     ```

   - **Claim Rewards**:
     ```bash
     cast send --rpc-url "https://rpc.testnet.immutable.com"    
     --private-key "<PrivateKey>"            
     "<StakingContractAddress>" 
     "claimRewards()"
     ```

6. Update the reward rate (optional):
   ```bash
   cast send --rpc-url "https://rpc.testnet.immutable.com"    
   --private-key "<PrivateKey>"            
   "<StakingContractAddress>" 
   "setRewardRate(uint256)" 
   "<NewRewardRate>"
   ```

## RISKS AND CONSIDERATIONS
These contracts are implemented only as concept examples and are not audited. When following this guide, you must make security and scalability considerations that fit the desired outcomes of the project under production conditions.

## REFERENCES
- OpenZeppelin Contracts: [https://docs.openzeppelin.com/contracts/4.x/](https://docs.openzeppelin.com/contracts/4.x/)
- Foundry Documentation: [https://book.getfoundry.sh/](https://book.getfoundry.sh/)
