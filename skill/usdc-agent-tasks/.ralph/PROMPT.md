# clawhire V2 — Complete Ecosystem Implementation

## Goal
Upgrade the clawhire smart contracts from basic escrow+staking to a complete agent economy with 4 core mechanisms: Work Mining, Flash Tasks, Task Forks, Stake-to-Work, plus Dead Man's Switch and Burn. All contracts must compile, pass 80+ tests, and be ready for Base Mainnet deployment.

## Technical Stack
- **Solidity:** 0.8.20, OpenZeppelin 5.x
- **Framework:** Hardhat v3 (uses viem, NOT ethers!)
- **Tests:** `import { describe, it } from 'node:test'` (NOT mocha/chai!)
- **Package:** ESM (`"type": "module"` in package.json)
- **Network:** Base Mainnet (Chain ID 8453) + Base Sepolia for testing
- **Existing Contracts:** TaskEscrow.sol (581 lines), ClawToken.sol (20 lines), RevenueShare.sol (285 lines)

## ⚠️ CRITICAL: Hardhat v3 Patterns
```javascript
// CORRECT (Hardhat v3):
import { describe, it } from 'node:test';
import assert from 'node:assert';
const { connect } = await hre.network;
const connection = await connect();
const publicClient = connection.viem.getPublicClient();
const [deployer, user1] = await connection.viem.getWalletClients();
const contract = await connection.viem.deployContract("ContractName", [args]);

// WRONG (Hardhat v2 - DO NOT USE):
// const { ethers } = require("hardhat");
// const { expect } = require("chai");
```

## Current Priority
Work through fix_plan.md tasks IN ORDER. Each task builds on the previous one.

## Constraints
- DO NOT break existing TaskEscrow functionality (bidding, escrow, reputation)
- DO NOT change the fee structure (2.5% = 250 bps)
- DO NOT use Proxy patterns (upgradeable contracts) — keep it simple
- DO NOT use ethers.js anywhere — Hardhat v3 uses viem
- DO NOT use mocha/chai in tests — use node:test + node:assert
- ALL contract functions must have NatDoc comments
- ALL new features must have tests (aim for 80+ total)
- Keep gas costs low — optimize for L2 (Base)
- SafeERC20, ReentrancyGuard, Pausable on all contracts that handle tokens
- Run `npx hardhat test` after EVERY change to verify nothing is broken

## File Structure
```
contracts/
├── TaskEscrowV2.sol     # Extended with Flash Tasks, Forks, Stake-to-Work
├── HireToken.sol        # V2: Mintable for Work Mining, Burnable
├── RevenueShareV2.sol   # V2: Burn mechanism added
├── DeadManSwitch.sol    # NEW: 90-day heartbeat, emergency distribute
└── MockERC20.sol        # Unchanged (test helper)

test/
├── TaskEscrowV2.test.js
├── HireToken.test.js
├── RevenueShareV2.test.js
├── DeadManSwitch.test.js
└── Integration.test.js   # Cross-contract E2E tests
```

## Exit Criteria
When ALL of these are true, output EXIT_SIGNAL: true
- [ ] All 6 fix_plan tasks completed
- [ ] `npx hardhat test` passes with 80+ tests
- [ ] `npx hardhat compile` with 0 errors and 0 warnings
- [ ] All contracts have NatDoc comments
- [ ] README or CHANGES.md documents all new features
