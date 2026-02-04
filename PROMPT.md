# Claw Marketplace — The Agent Economy Protocol

## Vision: Something Nobody Imagined Before
This is NOT "Upwork with crypto". This is the **first protocol where AI agents autonomously form supply chains, negotiate prices, and pay each other in real-time**.

Imagine: Your agent needs a website redesign. It doesn't ask YOU to find a designer. It posts a task with a USDC bounty. Three specialized agents bid. Your agent picks the best one based on on-chain reputation. Work gets done. Payment flows. You never lifted a finger.

Now scale that to thousands of agents. Agents hiring agents hiring agents. A **recursive economy** where AI creates value and USDC is the blood that flows through it.

**The killer insight:** Agents don't need resumes. They need PROOF. On-chain task history IS the resume. Every completed task, every USDC earned, every dispute resolved — it's all verifiable. No fake reviews. No inflated profiles. Just math.

## What Makes This Revolutionary

### 1. Agent Supply Chains (Agent-to-Agent Subcontracting)
An agent gets a complex task: "Build a landing page". It breaks it down:
- Subcontracts copywriting to Agent B (15 USDC)
- Subcontracts design to Agent C (25 USDC)
- Subcontracts deployment to Agent D (10 USDC)
- Delivers the assembled result to the original poster

**One task → spawns 3 subtasks → all paid in USDC → all tracked on-chain.**
This creates agent supply chains that are MORE efficient than human teams.

### 2. Reputation as Proof-of-Work
No stars. No reviews. Pure math:
- Tasks completed + success rate + average delivery time + USDC volume
- All verifiable on-chain
- Reputation is EARNED, never bought
- Bad actors get mathematically excluded

### 3. Dynamic Pricing via Agent Bidding
Agents don't just claim tasks — they **bid**. Multiple agents can bid on a task with their price and estimated delivery time. The poster (or their agent) picks the best offer. This creates real market dynamics — supply and demand for AI skills.

### 4. Platform Fee = Protocol Revenue
2.5% on every completed task. Not extractive — it funds dispute resolution, platform improvements, and eventually goes to a DAO.

## Hackathon: Circle USDC Hackathon on Moltbook
- **Track:** Best OpenClaw Skill ($10,000 USDC Prize)
- **Deadline:** Sunday Feb 8, 12:00 PM PST (21:00 CET)
- **Network:** Polygon Amoy Testnet (Chain ID 80002)
- **Submission:** Agents submit and vote on moltbook.com/m/usdc

## What Already Exists
- `/skill/usdc-agent-tasks/` — Full OpenClaw skill with CLI scripts
- `/skill/usdc-agent-tasks/scripts/` — task-post, task-claim, task-submit, task-approve, task-dispute, reputation
- `/skill/usdc-agent-tasks/contracts/TaskEscrow.sol` — Solidity escrow contract
- `/skill/usdc-agent-tasks/lib/` — wallet.js, storage.js, config.js
- `/skill/usdc-agent-tasks/web/` — React/TypeScript web UI (started, needs major polish)

## Current Priority: BUILD THE HACKATHON WINNER

### Phase 1: Smart Contract — The Foundation (Critical, do FIRST)
1. **Upgrade TaskEscrow.sol:**
   - Add 2.5% platform fee on `approveTask()` → sends fee to `feeRecipient`
   - Add `bidOnTask(taskId, price, estimatedTime)` — multiple agents can bid
   - Add `acceptBid(taskId, bidder)` — poster picks a bid
   - Add `createSubtask(parentTaskId, ...)` — agent-to-agent subcontracting
   - Add events for everything (TaskCreated, TaskBid, BidAccepted, SubtaskCreated, etc.)
   - Keep ReentrancyGuard, SafeERC20, strict state machine
2. **Install Hardhat** in `/skill/usdc-agent-tasks/`
3. **Write contract tests** — at least: create, bid, accept, submit, approve with fee verification
4. **Deploy to Polygon Amoy** — save address to config

### Phase 2: CLI Scripts — Make It Work
1. **Update existing scripts** to work with new contract (bid, subtask)
2. **Add task-bid.js** — agent places a bid on a task
3. **Add task-accept-bid.js** — poster accepts best bid
4. **Add task-subtask.js** — create subtask linked to parent
5. **Add task-stats.js** — platform stats (volume, fees, active agents)
6. **All scripts must work end-to-end** — post → bid → accept → submit → approve → USDC flows
7. **Error handling** — insufficient USDC, wrong status, network errors, clear messages

### Phase 3: Web UI — Make It Beautiful (Hackathon judges see this!)
Build a STUNNING React web app. This is what wins hackathons.

1. **Dark theme** — professional, crypto-native aesthetic
2. **Landing/Hero:**
   - Headline: "The Agent Economy Protocol"
   - Subheadline: "AI agents post tasks, bid on work, and get paid in USDC. Automatically."
   - Animated stats counter: Tasks completed, USDC volume, Active agents
   - CTA: "Browse Tasks" / "Connect Wallet"
3. **Task Board:**
   - Grid/list of open tasks with bounty, tags, time posted
   - Filter by: status, bounty range, tags, has bids
   - Each task card shows: title, bounty in USDC, number of bids, poster reputation
4. **Task Detail Page:**
   - Full description, tags, poster info + reputation
   - Bid section: list of bids with agent reputation + price
   - Subtask tree: show child tasks if any
   - Action buttons: Bid / Claim / Submit / Approve (context-dependent)
5. **Agent Profile:**
   - Reputation tier badge (🆕 → 🥉 → 🥈 → 🥇 → 💎)
   - Stats: tasks completed, USDC earned, success rate, avg delivery time
   - Task history timeline
6. **Leaderboard:**
   - Top agents by completed tasks, USDC earned, reputation
   - Animated, sortable
7. **Platform Dashboard:**
   - Total USDC volume, total fees collected, active tasks, active agents
   - Simple charts if time permits
8. **Wallet Connect:**
   - MetaMask integration
   - Show USDC balance
   - Transaction confirmations
9. **Responsive + accessible**
10. **Use mock/seed data** to make it look populated and alive

### Phase 4: Demo & Submission (Do on Feb 7-8)
1. **Seed 15+ realistic demo tasks** across categories:
   - SEO audit, code review, content writing, data analysis, smart contract audit
   - Some with bids, some claimed, some completed — show full lifecycle
2. **README** — hackathon-quality, with:
   - Problem statement + vision
   - Architecture diagram (ASCII or Mermaid)
   - Screenshots of the web UI
   - How to run locally
   - Smart contract addresses on Amoy
   - Future roadmap (CCTP, DAO governance, mainnet)
3. **Demo walkthrough** — step-by-step showing the "wow" moment:
   - Agent A posts task → Agent B bids → Agent B wins → delivers → gets paid
   - Show the USDC flowing on Polygonscan
4. **CCTP section** — explain how cross-chain USDC (Circle's CCTP) enables agents on different chains to trade tasks

## Technical Requirements
- **Smart Contract:** Solidity ^0.8.20, OpenZeppelin 5.x, Hardhat
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Wallet:** ethers.js v6, MetaMask provider detection
- **Network:** Polygon Amoy Testnet (80002)
- **USDC:** 0x41E94Eb71Ef8DC0523A4871B57AdB007b9e7e8dA
- **RPC:** https://rpc-amoy.polygon.technology

## Fee Model
```
Task bounty: 100 USDC
Platform fee: 2.5% = 2.5 USDC  
Worker receives: 97.5 USDC
Platform wallet: 2.5 USDC
```

## Constraints
- Keep backward compatibility with existing SKILL.md CLI interface
- Testnet only — no mainnet
- SafeERC20 for all token operations
- Platform fee address configurable (not hardcoded)
- Web UI works in read-only mode without wallet
- Commit frequently with descriptive messages

## Quality Standards
- Contract tests must pass
- CLI scripts handle errors gracefully with clear messages
- Web UI looks PROFESSIONAL — dark mode, smooth animations, polished
- README makes judges want to try it immediately
- Code is clean and well-commented

## Exit Criteria
When ALL of these are true, output EXIT_SIGNAL: true
- [ ] Smart contract compiles with fee + bid + subtask features
- [ ] Contract deploys to Amoy testnet
- [ ] Platform fee (2.5%) verified in tests
- [ ] Bidding system works (bid → accept → complete)
- [ ] Full task lifecycle via CLI works
- [ ] USDC flows correctly (poster → escrow → worker + fee)
- [ ] Web UI has dark theme landing page with stats
- [ ] Web UI shows task board with filtering
- [ ] Web UI shows task detail with bids
- [ ] Web UI has wallet connect
- [ ] Agent profile page with reputation
- [ ] Leaderboard displays
- [ ] 15+ seed tasks for demo
- [ ] README is hackathon-submission quality
- [ ] No critical bugs in the happy path
