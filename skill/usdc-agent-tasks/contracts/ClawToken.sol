// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ClawToken ($CLAW)
 * @notice Governance and revenue-sharing token for the clawhire protocol.
 *         Fixed supply of 100,000,000 tokens minted at deployment.
 *         Holders can stake in RevenueShare contract to earn USDC from platform fees.
 */
contract ClawToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18; // 100M tokens

    constructor(address initialHolder) ERC20("Claw Token", "CLAW") Ownable(msg.sender) {
        require(initialHolder != address(0), "Invalid initial holder");
        _mint(initialHolder, MAX_SUPPLY);
    }
}
