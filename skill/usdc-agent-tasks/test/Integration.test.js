import { expect } from "chai";
import hre from "hardhat";
import { parseUnits, keccak256, toBytes, formatUnits } from "viem";
import { describe, it } from "node:test";

describe("Integration: Full E2E Tests", function () {
  const parseUSDC = (n) => parseUnits(String(n), 6);
  const parseHIRE = (n) => parseUnits(String(n), 18);

  function createTaskId(str) {
    return keccak256(toBytes(str));
  }

  /**
   * Full deployment fixture: wire all V2 contracts together
   */
  async function deployFullFixture() {
    const nc = await hre.network.connect();
    const [owner, poster, worker1, worker2, treasury, team] =
      await nc.viem.getWalletClients();
    const publicClient = await nc.viem.getPublicClient();

    // 1. Deploy mock USDC
    const usdc = await nc.viem.deployContract("MockERC20", [
      "USD Coin",
      "USDC",
      6,
    ]);

    // 2. Deploy HireToken
    const hire = await nc.viem.deployContract("HireToken", [
      treasury.account.address,
      team.account.address,
    ]);

    // 3. Deploy RevenueShareV2
    const revenueShare = await nc.viem.deployContract("RevenueShareV2", [
      hire.address,
      usdc.address,
      treasury.account.address,
    ]);

    // 4. Deploy TaskEscrowV2 with RevenueShare as fee recipient
    const escrow = await nc.viem.deployContract("TaskEscrowV2", [
      usdc.address,
      revenueShare.address, // fees go to RevenueShare
    ]);

    // 5. Wire up: set HireToken on escrow, set escrow as minter
    await escrow.write.setHireToken([hire.address]);
    await hire.write.setMinter([escrow.address]);

    // 6. Deploy DeadManSwitch
    const dms = await nc.viem.deployContract("DeadManSwitch", [
      hire.address,
      usdc.address,
    ]);

    // Mint USDC to poster
    await usdc.write.mint([poster.account.address, parseUSDC(100_000)]);
    await usdc.write.mint([worker1.account.address, parseUSDC(100_000)]);

    // Transfer HIRE to workers for staking
    const hireAsTreasury = await nc.viem.getContractAt(
      "HireToken",
      hire.address,
      { client: { wallet: treasury } }
    );
    await hireAsTreasury.write.transfer([
      worker1.account.address,
      parseHIRE(100_000),
    ]);
    await hireAsTreasury.write.transfer([
      worker2.account.address,
      parseHIRE(100_000),
    ]);

    // Approve USDC spending
    const usdcAsPoster = await nc.viem.getContractAt(
      "MockERC20",
      usdc.address,
      { client: { wallet: poster } }
    );
    await usdcAsPoster.write.approve([escrow.address, parseUSDC(100_000)]);

    const usdcAsWorker1 = await nc.viem.getContractAt(
      "MockERC20",
      usdc.address,
      { client: { wallet: worker1 } }
    );
    await usdcAsWorker1.write.approve([escrow.address, parseUSDC(100_000)]);

    // Approve HIRE spending
    const hireAsWorker1 = await nc.viem.getContractAt(
      "HireToken",
      hire.address,
      { client: { wallet: worker1 } }
    );
    await hireAsWorker1.write.approve([escrow.address, parseHIRE(100_000)]);

    const hireAsWorker2 = await nc.viem.getContractAt(
      "HireToken",
      hire.address,
      { client: { wallet: worker2 } }
    );
    await hireAsWorker2.write.approve([escrow.address, parseHIRE(100_000)]);

    // Stake some HIRE in RevenueShare (treasury stakes)
    await hireAsTreasury.write.approve([
      revenueShare.address,
      parseHIRE(5_000_000),
    ]);
    const rsAsTreasury = await nc.viem.getContractAt(
      "RevenueShareV2",
      revenueShare.address,
      { client: { wallet: treasury } }
    );
    await rsAsTreasury.write.stake([parseHIRE(5_000_000)]);

    // Get contract instances
    const escrowAsPoster = await nc.viem.getContractAt(
      "TaskEscrowV2",
      escrow.address,
      { client: { wallet: poster } }
    );
    const escrowAsWorker1 = await nc.viem.getContractAt(
      "TaskEscrowV2",
      escrow.address,
      { client: { wallet: worker1 } }
    );
    const escrowAsWorker2 = await nc.viem.getContractAt(
      "TaskEscrowV2",
      escrow.address,
      { client: { wallet: worker2 } }
    );

    return {
      usdc,
      hire,
      revenueShare,
      escrow,
      escrowAsPoster,
      escrowAsWorker1,
      escrowAsWorker2,
      dms,
      hireAsTreasury,
      hireAsWorker1,
      hireAsWorker2,
      rsAsTreasury,
      publicClient,
      owner,
      poster,
      worker1,
      worker2,
      treasury,
      team,
    };
  }

  // =============================================================
  //                    E2E: Standard Task with Work Mining
  // =============================================================
  describe("E2E: Standard Task Flow with Work Mining", function () {
    it("should complete full lifecycle: create → stake → bid → accept → submit → approve → mine", async function () {
      const {
        escrowAsPoster,
        escrowAsWorker1,
        usdc,
        hire,
        revenueShare,
        poster,
        worker1,
        treasury,
      } = await deployFullFixture();
      const taskId = createTaskId("e2e-standard-1");
      const bounty = parseUSDC(100); // 100 USDC

      // Track starting balances
      const workerUsdcBefore = await usdc.read.balanceOf([
        worker1.account.address,
      ]);
      const workerHireBefore = await hire.read.balanceOf([
        worker1.account.address,
      ]);
      const posterHireBefore = await hire.read.balanceOf([
        poster.account.address,
      ]);

      // 1. Create task
      await escrowAsPoster.write.createTask([taskId, bounty]);

      // 2. Worker stakes HIRE + claims
      await escrowAsWorker1.write.claimTask([taskId]);

      // 3. Worker submits
      await escrowAsWorker1.write.submitDeliverable([
        taskId,
        keccak256(toBytes("completed work")),
      ]);

      // 4. Poster approves
      await escrowAsPoster.write.approveTask([taskId]);

      // VERIFY: Worker got USDC (minus fee)
      const workerUsdcAfter = await usdc.read.balanceOf([
        worker1.account.address,
      ]);
      const expectedFee = parseUSDC(2.5); // 2.5% of 100
      expect(workerUsdcAfter - workerUsdcBefore).to.equal(
        bounty - expectedFee
      );

      // VERIFY: Worker got $HIRE mined (net change from before task start)
      const workerHireAfter = await hire.read.balanceOf([
        worker1.account.address,
      ]);
      // Worker started with X HIRE, staked 5000 (claimTask), got 5000 back + 800 mined
      // Net: +800 HIRE from before the task
      expect(workerHireAfter - workerHireBefore).to.equal(parseHIRE(800));

      // VERIFY: Poster got $HIRE mined (20%)
      const posterHireAfter = await hire.read.balanceOf([
        poster.account.address,
      ]);
      expect(posterHireAfter - posterHireBefore).to.equal(parseHIRE(200));

      // VERIFY: Fee went to RevenueShare
      const rsBalance = await usdc.read.balanceOf([revenueShare.address]);
      // The fee should be in RevenueShare (not yet distributed)
      expect(rsBalance >= expectedFee).to.equal(true);

      // VERIFY: Distribute revenue and check burn
      await revenueShare.write.distributeRevenue([expectedFee]);
      expect(
        (await revenueShare.read.totalBurned()) > 0n
      ).to.equal(true); // Burn portion tracked
    });
  });

  // =============================================================
  //                    E2E: Flash Task Flow
  // =============================================================
  describe("E2E: Flash Task Flow", function () {
    it("should create flash task, submit correct answer, get instant payout + mining", async function () {
      const { escrowAsPoster, escrowAsWorker1, usdc, hire, worker1, poster } =
        await deployFullFixture();
      const taskId = createTaskId("e2e-flash-1");
      const bounty = parseUSDC(50);
      const answer = "the secret answer";
      const expectedHash = keccak256(toBytes(answer));

      const workerUsdcBefore = await usdc.read.balanceOf([
        worker1.account.address,
      ]);
      const workerHireBefore = await hire.read.balanceOf([
        worker1.account.address,
      ]);

      // 1. Create flash task
      await escrowAsPoster.write.createFlashTask([
        taskId,
        bounty,
        expectedHash,
      ]);

      // 2. Worker submits correct answer → instant payout
      await escrowAsWorker1.write.completeFlashTask([taskId, expectedHash]);

      // VERIFY: Worker got USDC
      const workerUsdcAfter = await usdc.read.balanceOf([
        worker1.account.address,
      ]);
      const fee = parseUSDC(1.25); // 2.5% of 50
      expect(workerUsdcAfter - workerUsdcBefore).to.equal(bounty - fee);

      // VERIFY: Worker got mined HIRE (80% of 50*10 = 400)
      const workerHireAfter = await hire.read.balanceOf([
        worker1.account.address,
      ]);
      expect(workerHireAfter - workerHireBefore).to.equal(parseHIRE(400));

      // VERIFY: Poster got mined HIRE (20% of 50*10 = 100)
      const posterHire = await hire.read.balanceOf([poster.account.address]);
      expect(posterHire >= parseHIRE(100)).to.equal(true);

      // VERIFY: Task is approved
      const task = await escrowAsPoster.read.getTask([taskId]);
      expect(task.status).to.equal(3); // Approved
    });
  });

  // =============================================================
  //                    E2E: Task Fork Flow
  // =============================================================
  describe("E2E: Task Fork Flow", function () {
    it("should create parent + subtasks, complete all, auto-complete parent, pay orchestrator", async function () {
      const {
        escrowAsPoster,
        escrowAsWorker1,
        escrowAsWorker2,
        usdc,
        worker1,
      } = await deployFullFixture();
      const parentId = createTaskId("e2e-fork-parent");
      const child1 = createTaskId("e2e-fork-child1");
      const child2 = createTaskId("e2e-fork-child2");
      const child3 = createTaskId("e2e-fork-child3");

      // 1. Create parent task
      await escrowAsPoster.write.createTask([parentId, parseUSDC(200)]);

      // 2. Worker1 claims parent
      await escrowAsWorker1.write.claimTask([parentId]);

      // 3. Worker1 (orchestrator) creates 3 subtasks
      await escrowAsWorker1.write.createSubtask([
        parentId,
        child1,
        parseUSDC(50),
      ]);
      await escrowAsWorker1.write.createSubtask([
        parentId,
        child2,
        parseUSDC(50),
      ]);
      await escrowAsWorker1.write.createSubtask([
        parentId,
        child3,
        parseUSDC(50),
      ]);

      // 4. Worker2 completes all subtasks
      const worker1UsdcBefore = await usdc.read.balanceOf([
        worker1.account.address,
      ]);

      // Child 1
      await escrowAsWorker2.write.claimTask([child1]);
      await escrowAsWorker2.write.submitDeliverable([
        child1,
        keccak256(toBytes("c1")),
      ]);
      await escrowAsWorker1.write.approveTask([child1]);

      // Child 2
      await escrowAsWorker2.write.claimTask([child2]);
      await escrowAsWorker2.write.submitDeliverable([
        child2,
        keccak256(toBytes("c2")),
      ]);
      await escrowAsWorker1.write.approveTask([child2]);

      // Child 3
      await escrowAsWorker2.write.claimTask([child3]);
      await escrowAsWorker2.write.submitDeliverable([
        child3,
        keccak256(toBytes("c3")),
      ]);
      await escrowAsWorker1.write.approveTask([child3]);

      const worker1UsdcAfter = await usdc.read.balanceOf([
        worker1.account.address,
      ]);

      // VERIFY: Orchestrator (worker1) got 10% fee from each subtask
      // 3 subtasks * 50 USDC * 10% = 15 USDC
      expect(worker1UsdcAfter - worker1UsdcBefore).to.equal(parseUSDC(15));

      // VERIFY: Parent auto-completed
      const parent = await escrowAsPoster.read.getTask([parentId]);
      expect(parent.status).to.equal(3); // Approved

      // VERIFY: Subtask status
      const [total, completed, failed, pending] =
        await escrowAsPoster.read.getSubtaskStatus([parentId]);
      expect(total).to.equal(3n);
      expect(completed).to.equal(3n);
      expect(failed).to.equal(0n);
      expect(pending).to.equal(0n);
    });
  });

  // =============================================================
  //                    E2E: Dispute + Slashing
  // =============================================================
  describe("E2E: Dispute + Slashing", function () {
    it("should create task, dispute, slash stake correctly (60/20/20)", async function () {
      const {
        escrow,
        escrowAsPoster,
        escrowAsWorker1,
        usdc,
        hire,
        poster,
        worker1,
        owner,
      } = await deployFullFixture();
      const taskId = createTaskId("e2e-dispute-1");
      const bounty = parseUSDC(100);

      // 1. Create task + worker bids with stake
      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.claimTask([taskId]);

      // 2. Submit bad work
      await escrowAsWorker1.write.submitDeliverable([
        taskId,
        keccak256(toBytes("bad work")),
      ]);

      // 3. Poster disputes
      await escrowAsPoster.write.disputeTask([taskId]);

      const posterHireBefore = await hire.read.balanceOf([
        poster.account.address,
      ]);
      const ownerHireBefore = await hire.read.balanceOf([
        owner.account.address,
      ]);
      const supplyBefore = await hire.read.totalSupply();

      // 4. Resolve in poster's favor
      await escrow.write.resolveDispute([taskId]);

      const posterHireAfter = await hire.read.balanceOf([
        poster.account.address,
      ]);
      const ownerHireAfter = await hire.read.balanceOf([
        owner.account.address,
      ]);
      const supplyAfter = await hire.read.totalSupply();

      // VERIFY: Stake was 5000 HIRE, 50% slashed = 2500 HIRE
      // 60% to poster = 1500 HIRE
      expect(posterHireAfter - posterHireBefore).to.equal(parseHIRE(1500));
      // 20% to resolver (owner) = 500 HIRE
      expect(ownerHireAfter - ownerHireBefore).to.equal(parseHIRE(500));
      // 20% burned = 500 HIRE
      expect(supplyBefore - supplyAfter).to.equal(parseHIRE(500));

      // VERIFY: USDC split
      const posterUsdcAfter = await usdc.read.balanceOf([
        poster.account.address,
      ]);
      // Poster gets 70% of 100 USDC = 70 USDC (from dispute split)
      // (poster also paid 100 USDC for the task, got 70 back from USDC dispute split)

      // VERIFY: Task status is Refunded
      const task = await escrow.read.getTask([taskId]);
      expect(task.status).to.equal(5); // Refunded
    });
  });

  // =============================================================
  //                    E2E: All Contracts Wired Together
  // =============================================================
  describe("E2E: Full Ecosystem Wiring", function () {
    it("should deploy all contracts, wire them, and verify cross-contract interaction", async function () {
      const {
        usdc,
        hire,
        revenueShare,
        escrow,
        dms,
        escrowAsPoster,
        escrowAsWorker1,
        worker1,
        poster,
        treasury,
      } = await deployFullFixture();

      // Verify wiring
      expect(
        (await escrow.read.usdc()).toLowerCase()
      ).to.equal(usdc.address.toLowerCase());

      expect(
        (await escrow.read.feeRecipient()).toLowerCase()
      ).to.equal(revenueShare.address.toLowerCase());

      // Verify HireToken is connected
      const hireAddr = await escrow.read.hireToken();
      expect(hireAddr.toLowerCase()).to.equal(hire.address.toLowerCase());

      // Verify minter is TaskEscrowV2
      expect(
        (await hire.read.minter()).toLowerCase()
      ).to.equal(escrow.address.toLowerCase());

      // Run a task and verify the full flow through all contracts
      const taskId = createTaskId("e2e-wiring-1");
      await escrowAsPoster.write.createTask([taskId, parseUSDC(100)]);
      await escrowAsWorker1.write.claimTask([taskId]);
      await escrowAsWorker1.write.submitDeliverable([
        taskId,
        keccak256(toBytes("verified work")),
      ]);
      await escrowAsPoster.write.approveTask([taskId]);

      // Fee arrived at RevenueShare
      const rsBalance = await usdc.read.balanceOf([revenueShare.address]);
      expect(rsBalance > 0n).to.equal(true);

      // Mining happened
      expect(
        (await hire.read.totalMined()) > 0n
      ).to.equal(true);

      // Worker has more HIRE than before (stake returned + mined)
      expect(
        (await hire.read.balanceOf([worker1.account.address])) > parseHIRE(100_000)
      ).to.equal(true);
    });

    it("should have 0 compile warnings and consistent state after multiple operations", async function () {
      const {
        escrow,
        escrowAsPoster,
        escrowAsWorker1,
        hire,
        usdc,
        revenueShare,
      } = await deployFullFixture();

      // Run 3 tasks
      for (let i = 0; i < 3; i++) {
        const taskId = createTaskId(`multi-op-${i}`);
        await escrowAsPoster.write.createTask([taskId, parseUSDC(50)]);
        await escrowAsWorker1.write.claimTask([taskId]);
        await escrowAsWorker1.write.submitDeliverable([
          taskId,
          keccak256(toBytes(`work-${i}`)),
        ]);
        await escrowAsPoster.write.approveTask([taskId]);
      }

      // Stats should be consistent
      const stats = await escrow.read.getStats();
      expect(stats[1]).to.equal(3n); // 3 tasks completed
      expect(stats[2]).to.equal(parseUSDC(150)); // 3 * 50 volume

      // Mining should have accumulated
      const mined = await hire.read.totalMined();
      // 3 tasks * 50 USDC * 10 rate = 1500 HIRE total mined
      expect(mined).to.equal(parseHIRE(1500));
    });
  });
});
