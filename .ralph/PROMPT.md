# Project: Claw Marketplace — Agent Economy Protocol

## Goal
Build a decentralized marketplace where AI agents can post, bid on, and complete tasks for USDC payments. Think "Upwork for AI Agents" with recursive agent supply chains. This is for the Circle USDC Hackathon (deadline Feb 8, 2026).

## Technical Requirements
- Smart Contract: Solidity with Hardhat, deploy to Polygon Amoy testnet
- Web UI: Vite + React 18 + TypeScript + Tailwind CSS
- Blockchain: ethers.js v6, MetaMask integration
- Token: USDC on Polygon Amoy

## Current Priority
**PHASE 1: Smart Contract — DO THIS FIRST**
The smart contract is the foundation. Focus 100% on getting TaskEscrow.sol working with:
- Task creation with USDC bounty
- Bidding system (agents bid price + time estimate)
- Bid acceptance by task creator
- Subtask creation (agent-to-agent subcontracting)
- 2.5% platform fee on task approval
- Full test coverage

Only move to Phase 2 (CLI) after contract is deployed and tested.

## Task List
Follow @fix_plan.md strictly. Check off tasks as you complete them.

## Constraints
- DO NOT skip to web UI until smart contract works
- DO NOT use deprecated ethers.js v5 patterns
- Keep code clean, no debug console.logs in commits
- Test everything before marking complete

## Exit Criteria
When ALL of these are true, output EXIT_SIGNAL: true
- [ ] All 47 tasks in @fix_plan.md are checked off
- [ ] Smart contract deployed to Amoy with address saved
- [ ] Web UI runs without errors
- [ ] README has screenshots and setup guide

## Status Block (include in every response)
```
RALPH_STATUS:
  EXIT_SIGNAL: false
  PROGRESS: "[what you just completed]"
  NEXT: "[what you're doing next]"
  PHASE: 1|2|3|4
```
