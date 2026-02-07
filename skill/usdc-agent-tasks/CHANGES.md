# clawhire V2 — Changelog

## V2.0.0 — Complete Agent Economy Upgrade

### New Contracts

#### HireToken (`contracts/HireToken.sol`)
- **Capped Supply**: 100M $HIRE with controlled minting (previously fixed-supply mint-all-at-deploy)
- **Work Mining**: 40M tokens (40%) reserved for work mining — minted as tasks complete
  - Mining rate: 10 $HIRE per 1 USDC of task value in epoch 1
  - Rate halves every 180 days (epoch-based)
  - Worker gets 80%, poster gets 20% of mined tokens
- **Initial Allocations** (60M minted at deploy):
  - 25% Treasury (25M)
  - 15% Staking Rewards (15M)
  - 10% Team (10M)
  - 10% Community (10M)
- **Burn**: ERC20Burnable — anyone can burn their own tokens, protocol burn via allowance
- **Minter Role**: Only authorized minter (TaskEscrowV2) can mint via `mintForWork()`

#### TaskEscrowV2 (`contracts/TaskEscrowV2.sol`)
- **All V1 Features Preserved**: Task creation, bidding, approval, disputes, reputation, subtasks
- **Flash Tasks**: Instant-resolution tasks via hash matching
  - `createFlashTask()` — poster provides expected result hash
  - `completeFlashTask()` — first correct answer wins, instant payout
  - No bid/accept flow — minimal gas
- **Stake-to-Work**: Bidders must stake $HIRE proportional to task value
  - Tier 1 (<=50 USDC): 500 HIRE
  - Tier 2 (<=500 USDC): 5,000 HIRE
  - Tier 3 (<=5000 USDC): 25,000 HIRE
  - Tier 4 (>5000 USDC): 50,000 HIRE
  - Stakes returned on successful completion or when outbid
  - Stakes returned to all bidders when task cancelled
- **Stake Slashing**: Dispute resolution slashes worker's $HIRE stake
  - 50% of stake slashed on dispute loss
  - Distribution: 60% poster, 20% resolver, 20% burned
- **Work Mining Integration**: Task completion triggers $HIRE minting
- **Task Forks (Enhanced Subtasks)**:
  - Max 2 levels (parent → children, no grandchildren)
  - 10% orchestrator fee from each subtask completion
  - Auto-complete parent when all children finish
  - `cancelSubtask()` for orchestrator
  - `getSubtaskStatus()` view function

#### RevenueShareV2 (`contracts/RevenueShareV2.sol`)
- **New Fee Split**: 50% stakers / 30% treasury / 20% burn (was 50/50)
- **Burn Mechanism**: 20% of platform fees sent to dead address (0x...dEaD)
- **Configurable**: `setBurnBps()` owner-only, max 50%
- **Stats**: `totalBurned` tracking, enhanced `getStats()` view

#### DeadManSwitch (`contracts/DeadManSwitch.sol`)
- **90-Day Heartbeat**: Owner must call `heartbeat()` every 90 days
- **Emergency Distribution**: Anyone can trigger after abandonment
  - Pro-rata distribution based on $HIRE holdings
  - Claim-based mechanism (prevent double-claiming)
- **Token Recovery**: Owner can recover tokens before abandonment
- **Trust Mechanism**: Ensures protocol funds are accessible if team disappears

### V1 Contracts (Preserved)
Old contracts kept in `contracts/` alongside V2 for backward compatibility:
- `TaskEscrow.sol` — original escrow (still deployed on Base Sepolia)
- `ClawToken.sol` — original fixed-supply token
- `RevenueShare.sol` — original 50/50 revenue share

### Deployment
- `scripts/deploy-v2.js` — deploys all V2 contracts and wires them together
- Supports: hardhat (local), base-sepolia, polygon-amoy, base (mainnet)

### Tests
- **147+ tests** across 6 test files
- Test files:
  - `HireToken.test.js` — 20 tests (mining, burn, allocations)
  - `TaskEscrowV2.test.js` — 38 tests (flash tasks, staking, slashing, forks, regression)
  - `RevenueShareV2.test.js` — 14 tests (50/30/20 split, burn tracking)
  - `DeadManSwitch.test.js` — 15 tests (heartbeat, emergency, claims)
  - `Integration.test.js` — 7 E2E tests (cross-contract flows)
  - `TaskEscrow.test.js` — 31 tests (V1 regression)
  - `RevenueShare.test.js` — 22 tests (V1 regression)
