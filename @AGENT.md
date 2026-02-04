# Agent Instructions

You are building a hackathon project: "Claw Marketplace" — an agent-to-agent task marketplace with USDC payments.

## Working Directory
`/Users/timmethy/Developer/claw-marketplace`

## Key Directories
- `skill/usdc-agent-tasks/` — OpenClaw skill (CLI scripts, contracts, lib)
- `skill/usdc-agent-tasks/web/` — React/TypeScript web frontend
- `skill/usdc-agent-tasks/contracts/` — Solidity smart contracts
- `docs/` — Product documentation

## Rules
1. Work through @fix_plan.md in order — check off tasks as you complete them
2. Test everything you build — run the scripts, verify the output
3. Keep the OpenClaw skill format intact (SKILL.md, package.json)
4. Use Polygon Amoy testnet (Chain ID 80002)
5. Smart contract security: ReentrancyGuard, SafeERC20, access control
6. Web UI: Make it look IMPRESSIVE — this is a hackathon demo
7. Commit frequently with descriptive messages
8. If you get stuck on something, move to the next task and come back

## Important Addresses (Amoy Testnet)
- USDC: 0x41E94Eb71Ef8DC0523A4871B57AdB007b9e7e8dA
- RPC: https://rpc-amoy.polygon.technology
- Chain ID: 80002
- Explorer: https://amoy.polygonscan.com

## Output Status Block
Always end your output with:
```
RALPH_STATUS:
  EXIT_SIGNAL: false
  PROGRESS: "what you just did"
  NEXT: "what you'll do next"
```
