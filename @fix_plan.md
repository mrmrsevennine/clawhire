# Fix Plan — Claw Marketplace: The Agent Economy Protocol

## Phase 1: Smart Contract (CRITICAL — Do First)
- [ ] Install Hardhat + OpenZeppelin in /skill/usdc-agent-tasks/
- [ ] Upgrade TaskEscrow.sol: add feeRecipient + 2.5% fee deduction on approveTask()
- [ ] Add bidOnTask(taskId, price, estimatedTime) function
- [ ] Add acceptBid(taskId, bidder) function
- [ ] Add createSubtask(parentTaskId, title, bounty) for agent-to-agent subcontracting
- [ ] Add getTaskBids(taskId) view function
- [ ] Add getSubtasks(parentTaskId) view function
- [ ] Emit events: TaskCreated, TaskBid, BidAccepted, SubtaskCreated, TaskApproved, FeeCollected
- [ ] Write hardhat tests: create task, bid, accept bid, submit, approve with fee check
- [ ] Write test: subtask creation and completion
- [ ] hardhat.config.js with Polygon Amoy network
- [ ] Deploy contract to Amoy, save address

## Phase 2: CLI Scripts
- [ ] Update task-post.js for new contract ABI
- [ ] Create task-bid.js — place bid with price + estimated time
- [ ] Create task-accept-bid.js — accept a specific bid
- [ ] Create task-subtask.js — create subtask linked to parent
- [ ] Create task-stats.js — show platform totals (volume, fees, agents)
- [ ] Update task-list.js to show bids count + subtask count
- [ ] Update task-approve.js to verify fee deduction
- [ ] Test full lifecycle end-to-end: post → bid → accept → submit → approve → verify USDC
- [ ] All scripts: graceful error handling, clear output messages

## Phase 3: Web UI (Wins the Hackathon!)
- [ ] Set up Vite + React 18 + TypeScript + Tailwind (fix existing setup)
- [ ] Dark theme design system (colors, fonts, spacing)
- [ ] Header: logo, nav, wallet connect button
- [ ] Landing Hero: "The Agent Economy Protocol" + animated stats + CTA
- [ ] Task Board page: grid of task cards with bounty, bids count, tags
- [ ] Task Board filters: status, bounty range, tags
- [ ] Task Detail page: full info + bids list + subtask tree
- [ ] Bid action: connect wallet → bid with price
- [ ] Agent Profile page: reputation tier badge + stats + history
- [ ] Leaderboard: top agents sortable by tasks/earnings/reputation
- [ ] Platform Dashboard: total volume, fees, tasks, agents (with counters)
- [ ] MetaMask wallet connection (ethers.js v6)
- [ ] Show USDC balance in header
- [ ] Transaction flow: approve USDC → deposit → confirmation
- [ ] Responsive design (mobile-friendly)
- [ ] Loading states + error states + empty states
- [ ] Use mock/seed data to populate

## Phase 4: Demo & Submission
- [ ] Seed 15+ demo tasks (SEO, code review, writing, analysis, audit)
- [ ] Include tasks in different states (open with bids, claimed, completed)
- [ ] Include at least 1 task with subtasks (show supply chain)
- [ ] README: vision, architecture diagram, screenshots, setup guide
- [ ] README: deployed contract addresses on Amoy
- [ ] README: future roadmap (CCTP, DAO, mainnet, agent discovery)
- [ ] Demo walkthrough section in README
- [ ] Final code cleanup, remove debug logs
- [ ] Git tag v1.0.0-hackathon
