# clawhire V2 — Implementation Plan

## Task 1: HireToken V2 — Work Mining + Burn
**Priority: HIGHEST** — This is the identity of the project.

### Changes to ClawToken.sol → HireToken.sol:
- [ ] Rename file to `HireToken.sol`, keep contract name `HireToken`
- [ ] Change from fixed-supply mint-all-at-deploy to CAPPED SUPPLY with controlled minting
- [ ] Add `MINTER_ROLE` — only TaskEscrow can call `mint()` (for Work Mining)
- [ ] Add `burn(uint256 amount)` — anyone can burn their own tokens
- [ ] Add `burnFrom(address, uint256)` — for protocol burn (needs allowance)
- [ ] Add Work Mining constants:
  ```
  MAX_SUPPLY = 100_000_000e18
  MINING_POOL = 40_000_000e18  (40% for work mining)
  EPOCH_DURATION = 180 days
  INITIAL_RATE = 10  (10 $HIRE per 1 USDC of task value in epoch 1)
  ```
- [ ] Add `totalMined` tracker
- [ ] Add `currentEpoch()` view function
- [ ] Add `miningRate()` view — returns current rate based on epoch (halving)
- [ ] Add `mintForWork(address worker, address poster, uint256 taskValueUSDC)`:
  - Only callable by authorized minter (TaskEscrow)
  - Calculate: `amount = taskValueUSDC * miningRate() / 1e6` (USDC has 6 decimals)
  - Worker gets 80%, Poster gets 20%
  - Reverts if totalMined + amount > MINING_POOL
  - Emits `WorkMined(worker, poster, workerAmount, posterAmount, epoch)`
- [ ] Constructor: mint initial allocations:
  - 25% Treasury (25M) → deployer/treasury address
  - 15% Staking Rewards (15M) → RevenueShare contract (or treasury for later)
  - 10% Team (10M) → team address (vesting handled off-chain for simplicity)
  - 10% Community (10M) → treasury for airdrops/grants
  - 40% stays unminted (mined through work)
- [ ] Write 12+ tests:
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
- [ ] Copy TaskEscrow.sol → TaskEscrowV2.sol
- [ ] Add `hireToken` state variable (set in constructor)
- [ ] Add `STAKE_REQUIREMENTS` mapping: task value tier → required $HIRE stake
  ```
  ≤ 50 USDC:    500 HIRE
  ≤ 500 USDC:   5,000 HIRE
  ≤ 5000 USDC:  25,000 HIRE
  > 5000 USDC:  50,000 HIRE
  ```
- [ ] Modify `bidOnTask()`: 
  - Agent must have staked sufficient $HIRE (transferFrom to escrow)
  - Store staked amount per bid
  - Return stake when bid is rejected/outbid
- [ ] Add `_returnStake(address bidder, bytes32 taskId)` internal function
- [ ] Modify `_releasePayment()`:
  - Return $HIRE stake to worker after successful completion
  - Call `hireToken.mintForWork(worker, poster, agreedPrice)` for Work Mining
- [ ] Add slashing in dispute resolution:
  - `resolveDispute()`: if worker loses, slash 30-50% of their $HIRE stake
  - 60% of slash → poster, 20% → resolver, 20% → burn
  - Emit `StakeSlashed(agent, amount, taskId)`

### Flash Tasks:
- [ ] Add `TaskType` enum: `Standard`, `Flash`
- [ ] Add `createFlashTask(bytes32 taskId, uint256 bountyAmount, bytes32 expectedResultHash)`:
  - Poster provides expected result hash
  - Smaller escrow, instant resolution
- [ ] Add `completeFlashTask(bytes32 taskId, bytes32 resultHash)`:
  - Anyone can submit
  - If resultHash matches expectedResultHash → instant payout
  - If no match → funds returned to poster
  - All in minimal gas
  - Emits `FlashTaskCompleted(taskId, worker, amount)`
- [ ] Flash tasks skip bid/accept flow — first correct answer wins

### Integration with HireToken:
- [ ] After task completion (approveTask, autoApprove), call `hireToken.mintForWork()`
- [ ] Flash task completion also triggers mining

### Write 25+ tests:
- [ ] Stake-to-Work: bid requires $HIRE stake
- [ ] Stake-to-Work: insufficient stake reverts
- [ ] Stake-to-Work: stake returned on successful completion
- [ ] Stake-to-Work: stake returned when outbid
- [ ] Slashing: worker loses dispute → stake slashed
- [ ] Slashing: correct distribution (60/20/20)
- [ ] Flash Task: create with expected hash
- [ ] Flash Task: correct answer gets instant payout
- [ ] Flash Task: wrong answer gets rejected
- [ ] Flash Task: triggers work mining
- [ ] Standard task: triggers work mining on approve
- [ ] All existing TaskEscrow tests still pass (regression)

---

## Task 3: Task Forks (Parent/Child Enhancement)
**Priority: HIGH** — Unique differentiator.

### Enhance TaskEscrowV2.sol:
- [ ] Existing `createSubtask()` already exists — enhance it:
  - Max 2 levels (parent → children, no grandchildren)
  - Orchestrator gets 10% fee from each sub-task completion
  - Parent auto-completes when all children are done
  - Parent can be refunded if any child fails (partial refund)
- [ ] Add `orchestratorFeeBps` (default 1000 = 10%)
- [ ] Add `getSubtaskStatus(bytes32 parentId)` view:
  - Returns: total children, completed, failed, pending
- [ ] Modify sub-task completion flow:
  - On child approve → check if all siblings done → if yes, auto-complete parent
  - Orchestrator fee deducted from each child payment
- [ ] Add `cancelSubtask(bytes32 taskId)` — only parent task holder can cancel

### Write 10+ tests:
- [ ] Create parent + 3 sub-tasks
- [ ] Sub-task completion triggers orchestrator fee
- [ ] All sub-tasks done → parent auto-completes
- [ ] Cannot create 3rd level (grandchild reverts)
- [ ] Orchestrator fee calculation correct (10%)
- [ ] Partial failure: one child fails, parent can refund

---

## Task 4: RevenueShareV2 — Burn Mechanism
**Priority: MEDIUM** — Deflationary pressure.

### Create RevenueShareV2.sol (based on RevenueShare.sol):
- [ ] Copy RevenueShare.sol → RevenueShareV2.sol
- [ ] Change fee split from 50/50 to 50/30/20:
  - 50% → Stakers (1.25% of task value)
  - 30% → Treasury (0.75%)
  - 20% → Buy-back & Burn $HIRE (0.50%)
- [ ] Add `hireToken` state variable
- [ ] Add `burnBps` (default 2000 = 20%)
- [ ] Modify `distributeRevenue()`:
  - Calculate burn portion
  - If hireToken is set: use USDC portion to track burn allocation
  - For simplicity: send burn-USDC to a dead address (0x000...dead) or treasury for manual buyback
  - Alternative: just burn $HIRE from treasury allocation
  - Emit `RevenueBurned(amount)`
- [ ] Add `setBurnBps(uint256 newBps)` — owner only, max 5000 (50%)

### Write 8+ tests:
- [ ] Distribution splits correctly (50/30/20)
- [ ] Burn amount calculated correctly
- [ ] setBurnBps works, respects max
- [ ] All existing RevenueShare tests still pass

---

## Task 5: DeadManSwitch
**Priority: MEDIUM** — Trust mechanism, simple to implement.

### Create DeadManSwitch.sol:
- [ ] State variables:
  ```solidity
  address public owner;
  uint256 public lastHeartbeat;
  uint256 public constant DEAD_THRESHOLD = 90 days;
  IERC20 public hireToken;
  IERC20 public usdc;
  ```
- [ ] `constructor(address _hireToken, address _usdc)` — sets owner, initial heartbeat
- [ ] `heartbeat()` — only owner, updates lastHeartbeat
- [ ] `isAbandoned()` view — returns true if > 90 days since heartbeat
- [ ] `emergencyDistribute()` — anyone can call if abandoned
  - Distributes all USDC + HIRE in this contract pro-rata to HIRE holders
  - Uses snapshot of HIRE balances (or simple claim mechanism)
  - Emits `EmergencyDistribution(usdcAmount, hireAmount)`
- [ ] `claimEmergency()` — individual claim after emergency triggered
  - Track who claimed to prevent double-claim
  - Amount = (userHireBalance / totalHireSupply) * contractBalances
- [ ] `recoverTokens(address token)` — owner only, NOT when abandoned

### Write 8+ tests:
- [ ] Heartbeat updates timestamp
- [ ] Only owner can heartbeat
- [ ] isAbandoned false before 90 days
- [ ] isAbandoned true after 90 days
- [ ] Cannot emergencyDistribute before abandoned
- [ ] Emergency distribution works correctly
- [ ] Cannot claim twice
- [ ] Owner cannot recover after abandoned

---

## Task 6: Integration Tests + Cleanup
**Priority: HIGH** — Everything must work together.

### Create test/Integration.test.js:
- [ ] Full E2E: Deploy all contracts, wire them together
- [ ] E2E Standard Task flow with Work Mining:
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
- [ ] E2E Flash Task flow:
  1. Poster creates flash task with expected hash
  2. Agent submits correct result
  3. Verify: Instant payout + mining
- [ ] E2E Task Fork flow:
  1. Create parent task
  2. Create 3 sub-tasks
  3. Complete all sub-tasks
  4. Verify: Parent auto-completed
  5. Verify: Orchestrator fee paid
- [ ] E2E Dispute + Slashing:
  1. Create task, agent bids with stake
  2. Submit bad work, poster disputes
  3. Resolve in poster's favor
  4. Verify: Stake slashed correctly (60/20/20)

### Cleanup:
- [ ] Delete old contracts (TaskEscrow.sol, ClawToken.sol, RevenueShare.sol) or move to `contracts/v1/`
- [ ] Update hardhat.config.js if needed
- [ ] Update deploy scripts for V2 contracts
- [ ] Create `scripts/deploy-v2.js` — deploys all contracts + wires them together
- [ ] Run `npx hardhat compile` — 0 errors, 0 warnings
- [ ] Run `npx hardhat test` — 80+ tests passing
- [ ] Write CHANGES.md documenting all V2 features

---

## Summary

| Task | New Tests | Priority |
|------|----------:|----------|
| 1. HireToken V2 (Mining + Burn) | 12+ | HIGHEST |
| 2. TaskEscrowV2 (Flash + Stake) | 25+ | HIGH |
| 3. Task Forks Enhancement | 10+ | HIGH |
| 4. RevenueShareV2 (Burn) | 8+ | MEDIUM |
| 5. DeadManSwitch | 8+ | MEDIUM |
| 6. Integration + Cleanup | 10+ | HIGH |
| **TOTAL** | **73+** | |

Target: **80+ tests total passing.**
