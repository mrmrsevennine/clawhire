# clawhire V2 — Implementation Plan

## Task 1: HireToken V2 — Work Mining + Burn
**Priority: HIGHEST** — This is the identity of the project.

### Changes to ClawToken.sol → HireToken.sol:
- [x] Rename file to `HireToken.sol`, keep contract name `HireToken`
- [x] Change from fixed-supply mint-all-at-deploy to CAPPED SUPPLY with controlled minting
- [x] Add `MINTER_ROLE` — only TaskEscrow can call `mint()` (for Work Mining)
- [x] Add `burn(uint256 amount)` — anyone can burn their own tokens
- [x] Add `burnFrom(address, uint256)` — for protocol burn (needs allowance)
- [x] Add Work Mining constants:
  ```
  MAX_SUPPLY = 100_000_000e18
  MINING_POOL = 40_000_000e18  (40% for work mining)
  EPOCH_DURATION = 180 days
  INITIAL_RATE = 10  (10 $HIRE per 1 USDC of task value in epoch 1)
  ```
- [x] Add `totalMined` tracker
- [x] Add `currentEpoch()` view function
- [x] Add `miningRate()` view — returns current rate based on epoch (halving)
- [x] Add `mintForWork(address worker, address poster, uint256 taskValueUSDC)`:
  - Only callable by authorized minter (TaskEscrow)
  - Calculate: `amount = taskValueUSDC * miningRate() / 1e6` (USDC has 6 decimals)
  - Worker gets 80%, Poster gets 20%
  - Reverts if totalMined + amount > MINING_POOL
  - Emits `WorkMined(worker, poster, workerAmount, posterAmount, epoch)`
- [x] Constructor: mint initial allocations:
  - 25% Treasury (25M) → deployer/treasury address
  - 15% Staking Rewards (15M) → RevenueShare contract (or treasury for later)
  - 10% Team (10M) → team address (vesting handled off-chain for simplicity)
  - 10% Community (10M) → treasury for airdrops/grants
  - 40% stays unminted (mined through work)
- [x] Write 12+ tests: (20 tests written)
  - Constructor mints correct initial allocations
  - Only minter can call mintForWork
  - Mining rate halves each epoch
  - Worker gets 80%, poster gets 20%
  - Cannot exceed MINING_POOL
  - Burn works correctly
  - currentEpoch returns correct epoch number
  - miningRate returns correct rate per epoch

---

## Task 2: TaskEscrowV2 — Flash Tasks + Stake-to-Work
**Priority: HIGH** — Core marketplace upgrades.

### Create TaskEscrowV2.sol (based on TaskEscrow.sol):
- [x] Copy TaskEscrow.sol → TaskEscrowV2.sol
- [x] Add `hireToken` state variable (set in constructor)
- [x] Add `STAKE_REQUIREMENTS` mapping: task value tier → required $HIRE stake
  ```
  ≤ 50 USDC:    500 HIRE
  ≤ 500 USDC:   5,000 HIRE
  ≤ 5000 USDC:  25,000 HIRE
  > 5000 USDC:  50,000 HIRE
  ```
- [x] Modify `bidOnTask()`:
  - Agent must have staked sufficient $HIRE (transferFrom to escrow)
  - Store staked amount per bid
  - Return stake when bid is rejected/outbid
- [x] Add `_returnStake(address bidder, bytes32 taskId)` internal function
- [x] Modify `_releasePayment()`:
  - Return $HIRE stake to worker after successful completion
  - Call `hireToken.mintForWork(worker, poster, agreedPrice)` for Work Mining
- [x] Add slashing in dispute resolution:
  - `resolveDispute()`: if worker loses, slash 30-50% of their $HIRE stake
  - 60% of slash → poster, 20% → resolver, 20% → burn
  - Emit `StakeSlashed(agent, amount, taskId)`

### Flash Tasks:
- [x] Add `TaskType` enum: `Standard`, `Flash`
- [x] Add `createFlashTask(bytes32 taskId, uint256 bountyAmount, bytes32 expectedResultHash)`:
  - Poster provides expected result hash
  - Smaller escrow, instant resolution
- [x] Add `completeFlashTask(bytes32 taskId, bytes32 resultHash)`:
  - Anyone can submit
  - If resultHash matches expectedResultHash → instant payout
  - If no match → funds returned to poster
  - All in minimal gas
  - Emits `FlashTaskCompleted(taskId, worker, amount)`
- [x] Flash tasks skip bid/accept flow — first correct answer wins

### Integration with HireToken:
- [x] After task completion (approveTask, autoApprove), call `hireToken.mintForWork()`
- [x] Flash task completion also triggers mining

### Write 25+ tests: (31 tests written)
- [x] Stake-to-Work: bid requires $HIRE stake
- [x] Stake-to-Work: insufficient stake reverts
- [x] Stake-to-Work: stake returned on successful completion
- [x] Stake-to-Work: stake returned when outbid
- [x] Slashing: worker loses dispute → stake slashed
- [x] Slashing: correct distribution (60/20/20)
- [x] Flash Task: create with expected hash
- [x] Flash Task: correct answer gets instant payout
- [x] Flash Task: wrong answer gets rejected
- [x] Flash Task: triggers work mining
- [x] Standard task: triggers work mining on approve
- [x] All existing TaskEscrow tests still pass (regression)

---

## Task 3: Task Forks (Parent/Child Enhancement)
**Priority: HIGH** — Unique differentiator.

### Enhance TaskEscrowV2.sol:
- [x] Existing `createSubtask()` already exists — enhance it:
  - Max 2 levels (parent → children, no grandchildren)
  - Orchestrator gets 10% fee from each sub-task completion
  - Parent auto-completes when all children are done
  - Parent can be refunded if any child fails (partial refund)
- [x] Add `orchestratorFeeBps` (default 1000 = 10%)
- [x] Add `getSubtaskStatus(bytes32 parentId)` view:
  - Returns: total children, completed, failed, pending
- [x] Modify sub-task completion flow:
  - On child approve → check if all siblings done → if yes, auto-complete parent
  - Orchestrator fee deducted from each child payment
- [x] Add `cancelSubtask(bytes32 taskId)` — only parent task holder can cancel

### Write 10+ tests: (7 fork-specific tests)
- [x] Create parent + 3 sub-tasks
- [x] Sub-task completion triggers orchestrator fee
- [x] All sub-tasks done → parent auto-completes
- [x] Cannot create 3rd level (grandchild reverts)
- [x] Orchestrator fee calculation correct (10%)
- [x] Partial failure: one child fails, parent can refund

---

## Task 4: RevenueShareV2 — Burn Mechanism
**Priority: MEDIUM** — Deflationary pressure.

### Create RevenueShareV2.sol (based on RevenueShare.sol):
- [x] Copy RevenueShare.sol → RevenueShareV2.sol
- [x] Change fee split from 50/50 to 50/30/20:
  - 50% → Stakers (1.25% of task value)
  - 30% → Treasury (0.75%)
  - 20% → Buy-back & Burn $HIRE (0.50%)
- [x] Add `hireToken` state variable
- [x] Add `burnBps` (default 2000 = 20%)
- [x] Modify `distributeRevenue()`:
  - Calculate burn portion
  - If hireToken is set: use USDC portion to track burn allocation
  - For simplicity: send burn-USDC to a dead address (0x000...dead) or treasury for manual buyback
  - Alternative: just burn $HIRE from treasury allocation
  - Emit `RevenueBurned(amount)`
- [x] Add `setBurnBps(uint256 newBps)` — owner only, max 5000 (50%)

### Write 8+ tests: (14 tests written)
- [x] Distribution splits correctly (50/30/20)
- [x] Burn amount calculated correctly
- [x] setBurnBps works, respects max
- [x] All existing RevenueShare tests still pass

---

## Task 5: DeadManSwitch
**Priority: MEDIUM** — Trust mechanism, simple to implement.

### Create DeadManSwitch.sol:
- [x] State variables:
  ```solidity
  address public owner;
  uint256 public lastHeartbeat;
  uint256 public constant DEAD_THRESHOLD = 90 days;
  IERC20 public hireToken;
  IERC20 public usdc;
  ```
- [x] `constructor(address _hireToken, address _usdc)` — sets owner, initial heartbeat
- [x] `heartbeat()` — only owner, updates lastHeartbeat
- [x] `isAbandoned()` view — returns true if > 90 days since heartbeat
- [x] `emergencyDistribute()` — anyone can call if abandoned
  - Distributes all USDC + HIRE in this contract pro-rata to HIRE holders
  - Uses snapshot of HIRE balances (or simple claim mechanism)
  - Emits `EmergencyDistribution(usdcAmount, hireAmount)`
- [x] `claimEmergency()` — individual claim after emergency triggered
  - Track who claimed to prevent double-claim
  - Amount = (userHireBalance / totalHireSupply) * contractBalances
- [x] `recoverTokens(address token)` — owner only, NOT when abandoned

### Write 8+ tests: (15 tests written)
- [x] Heartbeat updates timestamp
- [x] Only owner can heartbeat
- [x] isAbandoned false before 90 days
- [x] isAbandoned true after 90 days
- [x] Cannot emergencyDistribute before abandoned
- [x] Emergency distribution works correctly
- [x] Cannot claim twice
- [x] Owner cannot recover after abandoned

---

## Task 6: Integration Tests + Cleanup
**Priority: HIGH** — Everything must work together.

### Create test/Integration.test.js:
- [x] Full E2E: Deploy all contracts, wire them together
- [x] E2E Standard Task flow with Work Mining:
  1. Deploy HireToken, TaskEscrowV2, RevenueShareV2
  2. Set TaskEscrowV2 as minter on HireToken
  3. Create task (50 USDC)
  4. Agent stakes $HIRE + bids
  5. Poster accepts
  6. Agent submits + poster approves
  7. Verify: Agent got USDC + $HIRE mined
  8. Verify: Fee went to RevenueShare
  9. Verify: Burn portion tracked
  10. Verify: Agent's $HIRE stake returned
- [x] E2E Flash Task flow:
  1. Poster creates flash task with expected hash
  2. Agent submits correct result
  3. Verify: Instant payout + mining
- [x] E2E Task Fork flow:
  1. Create parent task
  2. Create 3 sub-tasks
  3. Complete all sub-tasks
  4. Verify: Parent auto-completed
  5. Verify: Orchestrator fee paid
- [x] E2E Dispute + Slashing:
  1. Create task, agent bids with stake
  2. Submit bad work, poster disputes
  3. Resolve in poster's favor
  4. Verify: Stake slashed correctly (60/20/20)

### Cleanup:
- [x] Old contracts kept in `contracts/` alongside V2 (avoids artifact conflicts)
- [x] hardhat.config.js unchanged (already correct)
- [x] Create `scripts/deploy-v2.js` — deploys all contracts + wires them together
- [x] Run `npx hardhat compile` — 0 errors, 0 warnings
- [x] Run `npx hardhat test` — **147 tests passing** (target was 80+)
- [x] Write CHANGES.md documenting all V2 features

---

## Summary

| Task | New Tests | Actual | Priority |
|------|----------:|-------:|----------|
| 1. HireToken V2 (Mining + Burn) | 12+ | 20 | HIGHEST |
| 2. TaskEscrowV2 (Flash + Stake) | 25+ | 38 | HIGH |
| 3. Task Forks Enhancement | 10+ | 7 | HIGH |
| 4. RevenueShareV2 (Burn) | 8+ | 14 | MEDIUM |
| 5. DeadManSwitch | 8+ | 15 | MEDIUM |
| 6. Integration + Cleanup | 10+ | 7 | HIGH |
| V1 Regression (TaskEscrow + RevenueShare) | — | 46 | — |
| **TOTAL** | **73+** | **147** | |

Target: **80+ tests total passing.** Achieved: **147 tests passing.**
