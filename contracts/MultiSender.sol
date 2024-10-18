// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MultiSender {
    function multiSendToken(
        IERC20 token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        require(recipients.length == amounts.length, "Mismatched arrays");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(token.transferFrom(msg.sender, recipients[i], amounts[i]), "Transfer failed");
        }
    }
}
