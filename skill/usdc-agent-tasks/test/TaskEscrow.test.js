import { expect } from "chai";
import hre from "hardhat";
import { parseUnits, keccak256, toBytes, zeroHash } from "viem";
import { describe, it } from "node:test";

describe("TaskEscrow", function () {
  // Helper to create task ID
  function createTaskId(str) {
    return keccak256(toBytes(str));
  }

  // Fixture to deploy contracts and set up test accounts
  async function deployFixture() {
    const networkConnection = await hre.network.connect();
    const [owner, poster, worker1, worker2, feeRecipient] = await networkConnection.viem.getWalletClients();
    const publicClient = await networkConnection.viem.getPublicClient();

    // Deploy mock USDC token
    const usdc = await networkConnection.viem.deployContract("MockERC20", ["USD Coin", "USDC", 6]);

    // Deploy TaskEscrow
    const escrow = await networkConnection.viem.deployContract("TaskEscrow", [
      usdc.address,
      feeRecipient.account.address,
    ]);

    // Mint USDC to poster (10,000 USDC)
    const mintAmount = parseUnits("10000", 6);
    await usdc.write.mint([poster.account.address, mintAmount]);

    // Mint to worker1 for subtask testing
    await usdc.write.mint([worker1.account.address, mintAmount]);

    // Approve escrow to spend poster's USDC
    const usdcAsPoster = await networkConnection.viem.getContractAt("MockERC20", usdc.address, {
      client: { wallet: poster },
    });
    await usdcAsPoster.write.approve([escrow.address, mintAmount]);

    const usdcAsWorker1 = await networkConnection.viem.getContractAt("MockERC20", usdc.address, {
      client: { wallet: worker1 },
    });
    await usdcAsWorker1.write.approve([escrow.address, mintAmount]);

    // Get contract instances for different accounts
    const escrowAsPoster = await networkConnection.viem.getContractAt("TaskEscrow", escrow.address, {
      client: { wallet: poster },
    });
    const escrowAsWorker1 = await networkConnection.viem.getContractAt("TaskEscrow", escrow.address, {
      client: { wallet: worker1 },
    });
    const escrowAsWorker2 = await networkConnection.viem.getContractAt("TaskEscrow", escrow.address, {
      client: { wallet: worker2 },
    });

    return {
      escrow,
      escrowAsPoster,
      escrowAsWorker1,
      escrowAsWorker2,
      usdc,
      usdcAsPoster,
      usdcAsWorker1,
      owner,
      poster,
      worker1,
      worker2,
      feeRecipient,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct USDC address", async function () {
      const { escrow, usdc } = await deployFixture();
      expect((await escrow.read.usdc()).toLowerCase()).to.equal(usdc.address.toLowerCase());
    });

    it("Should set the correct fee recipient", async function () {
      const { escrow, feeRecipient } = await deployFixture();
      expect((await escrow.read.feeRecipient()).toLowerCase()).to.equal(
        feeRecipient.account.address.toLowerCase()
      );
    });

    it("Should set initial platform fee to 2.5%", async function () {
      const { escrow } = await deployFixture();
      expect(await escrow.read.platformFeeBps()).to.equal(250n);
    });
  });

  describe("Task Creation", function () {
    it("Should create a task with correct bounty", async function () {
      const { escrowAsPoster, poster } = await deployFixture();
      const taskId = createTaskId("task-001");
      const bounty = parseUnits("100", 6);

      await escrowAsPoster.write.createTask([taskId, bounty]);

      const task = await escrowAsPoster.read.getTask([taskId]);
      expect(task.poster.toLowerCase()).to.equal(poster.account.address.toLowerCase());
      expect(task.bounty).to.equal(bounty);
      expect(task.status).to.equal(0); // Open
    });

    it("Should transfer USDC to escrow on task creation", async function () {
      const { escrowAsPoster, escrow, usdc, poster } = await deployFixture();
      const taskId = createTaskId("task-002");
      const bounty = parseUnits("50", 6);

      const posterBalanceBefore = await usdc.read.balanceOf([poster.account.address]);
      await escrowAsPoster.write.createTask([taskId, bounty]);
      const posterBalanceAfter = await usdc.read.balanceOf([poster.account.address]);

      expect(posterBalanceBefore - posterBalanceAfter).to.equal(bounty);
      expect(await usdc.read.balanceOf([escrow.address])).to.equal(bounty);
    });

    it("Should revert if task already exists", async function () {
      const { escrowAsPoster } = await deployFixture();
      const taskId = createTaskId("task-003");
      const bounty = parseUnits("100", 6);

      await escrowAsPoster.write.createTask([taskId, bounty]);

      try {
        await escrowAsPoster.write.createTask([taskId, bounty]);
        expect.fail("Should have reverted");
      } catch (e) {
        expect(e.message).to.include("TaskAlreadyExists");
      }
    });

    it("Should revert if bounty is zero", async function () {
      const { escrowAsPoster } = await deployFixture();
      const taskId = createTaskId("task-004");

      try {
        await escrowAsPoster.write.createTask([taskId, 0n]);
        expect.fail("Should have reverted");
      } catch (e) {
        expect(e.message).to.include("InvalidBounty");
      }
    });
  });

  describe("Bidding System", function () {
    it("Should allow workers to bid on open tasks", async function () {
      const { escrowAsPoster, escrowAsWorker1, worker1 } = await deployFixture();
      const taskId = createTaskId("task-bid-1");
      const bounty = parseUnits("100", 6);
      const bidPrice = parseUnits("80", 6);
      const estimatedTime = 3600n; // 1 hour

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.bidOnTask([taskId, bidPrice, estimatedTime]);

      const task = await escrowAsPoster.read.getTask([taskId]);
      expect(task.bidCount).to.equal(1n);

      const bid = await escrowAsPoster.read.getBid([taskId, worker1.account.address]);
      expect(bid.price).to.equal(bidPrice);
      expect(bid.estimatedTime).to.equal(estimatedTime);
    });

    it("Should allow multiple workers to bid", async function () {
      const { escrowAsPoster, escrowAsWorker1, escrowAsWorker2 } = await deployFixture();
      const taskId = createTaskId("task-bid-2");
      const bounty = parseUnits("100", 6);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.bidOnTask([taskId, parseUnits("80", 6), 3600n]);
      await escrowAsWorker2.write.bidOnTask([taskId, parseUnits("90", 6), 7200n]);

      const task = await escrowAsPoster.read.getTask([taskId]);
      expect(task.bidCount).to.equal(2n);

      const [bidders, bids] = await escrowAsPoster.read.getTaskBids([taskId]);
      expect(bidders.length).to.equal(2);
    });

    it("Should prevent poster from bidding on own task", async function () {
      const { escrowAsPoster } = await deployFixture();
      const taskId = createTaskId("task-bid-3");
      const bounty = parseUnits("100", 6);

      await escrowAsPoster.write.createTask([taskId, bounty]);

      try {
        await escrowAsPoster.write.bidOnTask([taskId, bounty, 3600n]);
        expect.fail("Should have reverted");
      } catch (e) {
        expect(e.message).to.include("PosterCannotClaimOwnTask");
      }
    });

    it("Should allow poster to accept a bid", async function () {
      const { escrowAsPoster, escrowAsWorker1, worker1 } = await deployFixture();
      const taskId = createTaskId("task-bid-5");
      const bounty = parseUnits("100", 6);
      const bidPrice = parseUnits("80", 6);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.bidOnTask([taskId, bidPrice, 3600n]);
      await escrowAsPoster.write.acceptBid([taskId, worker1.account.address]);

      const task = await escrowAsPoster.read.getTask([taskId]);
      expect(task.worker.toLowerCase()).to.equal(worker1.account.address.toLowerCase());
      expect(task.agreedPrice).to.equal(bidPrice);
      expect(task.status).to.equal(1); // Claimed
    });

    it("Should refund poster the difference when accepting lower bid", async function () {
      const { escrowAsPoster, escrowAsWorker1, usdc, poster, worker1 } = await deployFixture();
      const taskId = createTaskId("task-bid-6");
      const bounty = parseUnits("100", 6);
      const bidPrice = parseUnits("80", 6);
      const refundAmount = bounty - bidPrice;

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.bidOnTask([taskId, bidPrice, 3600n]);

      const posterBalanceBefore = await usdc.read.balanceOf([poster.account.address]);
      await escrowAsPoster.write.acceptBid([taskId, worker1.account.address]);
      const posterBalanceAfter = await usdc.read.balanceOf([poster.account.address]);

      expect(posterBalanceAfter - posterBalanceBefore).to.equal(refundAmount);
    });
  });

  describe("Direct Claim (Legacy)", function () {
    it("Should allow direct claim at full bounty price", async function () {
      const { escrowAsPoster, escrowAsWorker1, worker1 } = await deployFixture();
      const taskId = createTaskId("task-claim-1");
      const bounty = parseUnits("100", 6);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.claimTask([taskId]);

      const task = await escrowAsPoster.read.getTask([taskId]);
      expect(task.worker.toLowerCase()).to.equal(worker1.account.address.toLowerCase());
      expect(task.agreedPrice).to.equal(bounty);
      expect(task.status).to.equal(1); // Claimed
    });
  });

  describe("Deliverable Submission", function () {
    it("Should allow worker to submit deliverable", async function () {
      const { escrowAsPoster, escrowAsWorker1 } = await deployFixture();
      const taskId = createTaskId("task-submit-1");
      const bounty = parseUnits("100", 6);
      const deliverableHash = keccak256(toBytes("ipfs://QmXyz..."));

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.claimTask([taskId]);
      await escrowAsWorker1.write.submitDeliverable([taskId, deliverableHash]);

      const task = await escrowAsPoster.read.getTask([taskId]);
      expect(task.deliverableHash).to.equal(deliverableHash);
      expect(task.status).to.equal(2); // Submitted
    });

    it("Should revert if non-worker tries to submit", async function () {
      const { escrowAsPoster, escrowAsWorker1, escrowAsWorker2 } = await deployFixture();
      const taskId = createTaskId("task-submit-2");
      const bounty = parseUnits("100", 6);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.claimTask([taskId]);

      try {
        await escrowAsWorker2.write.submitDeliverable([
          taskId,
          keccak256(toBytes("fake")),
        ]);
        expect.fail("Should have reverted");
      } catch (e) {
        expect(e.message).to.include("OnlyWorkerCanPerform");
      }
    });
  });

  describe("Task Approval with Platform Fee", function () {
    it("Should pay worker and collect 2.5% platform fee", async function () {
      const { escrowAsPoster, escrowAsWorker1, usdc, worker1, feeRecipient } =
        await deployFixture();
      const taskId = createTaskId("task-approve-1");
      const bounty = parseUnits("100", 6);
      const expectedFee = parseUnits("2.5", 6); // 2.5%
      const expectedWorkerPayout = bounty - expectedFee;

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.claimTask([taskId]);
      await escrowAsWorker1.write.submitDeliverable([taskId, keccak256(toBytes("work"))]);

      const workerBalanceBefore = await usdc.read.balanceOf([worker1.account.address]);
      const feeRecipientBalanceBefore = await usdc.read.balanceOf([feeRecipient.account.address]);

      await escrowAsPoster.write.approveTask([taskId]);

      const workerBalanceAfter = await usdc.read.balanceOf([worker1.account.address]);
      const feeRecipientBalanceAfter = await usdc.read.balanceOf([feeRecipient.account.address]);

      expect(workerBalanceAfter - workerBalanceBefore).to.equal(expectedWorkerPayout);
      expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(expectedFee);
    });

    it("Should correctly calculate fee on accepted bid price", async function () {
      const { escrowAsPoster, escrowAsWorker1, usdc, worker1, feeRecipient } =
        await deployFixture();
      const taskId = createTaskId("task-approve-2");
      const bounty = parseUnits("100", 6);
      const bidPrice = parseUnits("80", 6);
      const expectedFee = parseUnits("2", 6); // 2.5% of 80 = 2
      const expectedWorkerPayout = bidPrice - expectedFee;

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.bidOnTask([taskId, bidPrice, 3600n]);
      await escrowAsPoster.write.acceptBid([taskId, worker1.account.address]);
      await escrowAsWorker1.write.submitDeliverable([taskId, keccak256(toBytes("work"))]);

      const workerBalanceBefore = await usdc.read.balanceOf([worker1.account.address]);

      await escrowAsPoster.write.approveTask([taskId]);

      const workerBalanceAfter = await usdc.read.balanceOf([worker1.account.address]);
      expect(workerBalanceAfter - workerBalanceBefore).to.equal(expectedWorkerPayout);

      // Verify fee recipient got the fee
      expect(await usdc.read.balanceOf([feeRecipient.account.address])).to.equal(expectedFee);
    });

    it("Should update platform statistics on approval", async function () {
      const { escrowAsPoster, escrowAsWorker1 } = await deployFixture();
      const taskId = createTaskId("task-approve-3");
      const bounty = parseUnits("100", 6);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.claimTask([taskId]);
      await escrowAsWorker1.write.submitDeliverable([taskId, keccak256(toBytes("work"))]);
      await escrowAsPoster.write.approveTask([taskId]);

      const stats = await escrowAsPoster.read.getStats();
      expect(stats[1]).to.equal(1n); // tasksCompleted
      expect(stats[2]).to.equal(bounty); // volumeUsdc
      expect(stats[3]).to.equal(parseUnits("2.5", 6)); // feesCollected
    });
  });

  describe("Subtask Creation", function () {
    it("Should allow worker to create subtask", async function () {
      const { escrowAsPoster, escrowAsWorker1, worker1 } = await deployFixture();
      const parentTaskId = createTaskId("parent-task-1");
      const subtaskId = createTaskId("subtask-1");
      const parentBounty = parseUnits("100", 6);
      const subtaskBounty = parseUnits("25", 6);

      // Create and claim parent task
      await escrowAsPoster.write.createTask([parentTaskId, parentBounty]);
      await escrowAsWorker1.write.claimTask([parentTaskId]);

      // Worker1 creates subtask
      await escrowAsWorker1.write.createSubtask([parentTaskId, subtaskId, subtaskBounty]);

      const subtask = await escrowAsPoster.read.getTask([subtaskId]);
      expect(subtask.poster.toLowerCase()).to.equal(worker1.account.address.toLowerCase());
      expect(subtask.bounty).to.equal(subtaskBounty);
      expect(subtask.parentTaskId).to.equal(parentTaskId);

      // Verify subtask is linked to parent
      const childTasks = await escrowAsPoster.read.getSubtasks([parentTaskId]);
      expect(childTasks.length).to.equal(1);
      expect(childTasks[0]).to.equal(subtaskId);
    });

    it("Should revert if non-worker tries to create subtask", async function () {
      const { escrowAsPoster, escrowAsWorker1, escrowAsWorker2 } = await deployFixture();
      const parentTaskId = createTaskId("parent-task-2");
      const subtaskId = createTaskId("subtask-2");
      const bounty = parseUnits("100", 6);

      await escrowAsPoster.write.createTask([parentTaskId, bounty]);
      await escrowAsWorker1.write.claimTask([parentTaskId]);

      // worker2 is not the parent task worker
      try {
        await escrowAsWorker2.write.createSubtask([
          parentTaskId,
          subtaskId,
          parseUnits("10", 6),
        ]);
        expect.fail("Should have reverted");
      } catch (e) {
        expect(e.message).to.include("NotParentTaskWorker");
      }
    });
  });

  describe("Dispute and Refund", function () {
    it("Should allow poster to dispute within window", async function () {
      const { escrowAsPoster, escrowAsWorker1 } = await deployFixture();
      const taskId = createTaskId("task-dispute-1");
      const bounty = parseUnits("100", 6);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.claimTask([taskId]);
      await escrowAsWorker1.write.submitDeliverable([taskId, keccak256(toBytes("work"))]);
      await escrowAsPoster.write.disputeTask([taskId]);

      const task = await escrowAsPoster.read.getTask([taskId]);
      expect(task.status).to.equal(4); // Disputed
    });

    it("Should resolve dispute with fair split (owner arbitration)", async function () {
      const { escrow, escrowAsPoster, escrowAsWorker1, usdc, poster, worker1 } = await deployFixture();
      const taskId = createTaskId("task-refund-1");
      const bounty = parseUnits("100", 6);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.claimTask([taskId]);
      await escrowAsWorker1.write.submitDeliverable([taskId, keccak256(toBytes("work"))]);
      await escrowAsPoster.write.disputeTask([taskId]);

      const posterBalanceBefore = await usdc.read.balanceOf([poster.account.address]);
      const workerBalanceBefore = await usdc.read.balanceOf([worker1.account.address]);

      // Owner (arbitrator) resolves dispute — 70/30 split
      await escrow.write.resolveDispute([taskId]);

      const posterBalanceAfter = await usdc.read.balanceOf([poster.account.address]);
      const workerBalanceAfter = await usdc.read.balanceOf([worker1.account.address]);

      // Poster gets 70% = 70 USDC, Worker gets 30% = 30 USDC
      expect(posterBalanceAfter - posterBalanceBefore).to.equal(parseUnits("70", 6));
      expect(workerBalanceAfter - workerBalanceBefore).to.equal(parseUnits("30", 6));
    });
  });

  describe("Task Cancellation", function () {
    it("Should allow poster to cancel open task", async function () {
      const { escrowAsPoster, usdc, poster } = await deployFixture();
      const taskId = createTaskId("task-cancel-1");
      const bounty = parseUnits("100", 6);

      await escrowAsPoster.write.createTask([taskId, bounty]);

      const posterBalanceBefore = await usdc.read.balanceOf([poster.account.address]);
      await escrowAsPoster.write.cancelTask([taskId]);
      const posterBalanceAfter = await usdc.read.balanceOf([poster.account.address]);

      expect(posterBalanceAfter - posterBalanceBefore).to.equal(bounty);

      const task = await escrowAsPoster.read.getTask([taskId]);
      expect(task.status).to.equal(6); // Cancelled
    });

    it("Should revert if trying to cancel claimed task", async function () {
      const { escrowAsPoster, escrowAsWorker1 } = await deployFixture();
      const taskId = createTaskId("task-cancel-2");
      const bounty = parseUnits("100", 6);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.claimTask([taskId]);

      try {
        await escrowAsPoster.write.cancelTask([taskId]);
        expect.fail("Should have reverted");
      } catch (e) {
        expect(e.message).to.include("TaskNotOpen");
      }
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update fee", async function () {
      const { escrow } = await deployFixture();

      await escrow.write.setFee([500n]); // 5%
      expect(await escrow.read.platformFeeBps()).to.equal(500n);
    });

    it("Should revert if fee is too high", async function () {
      const { escrow } = await deployFixture();

      try {
        await escrow.write.setFee([1500n]); // 15% > 10% max
        expect.fail("Should have reverted");
      } catch (e) {
        expect(e.message).to.include("FeeTooHigh");
      }
    });
  });

  describe("Full Lifecycle", function () {
    it("Should complete full task lifecycle: create → bid → accept → submit → approve", async function () {
      const { escrowAsPoster, escrowAsWorker1, usdc, worker1, feeRecipient } =
        await deployFixture();
      const taskId = createTaskId("full-lifecycle-1");
      const bounty = parseUnits("100", 6);
      const bidPrice = parseUnits("80", 6);

      // 1. Create task
      await escrowAsPoster.write.createTask([taskId, bounty]);
      expect((await escrowAsPoster.read.getTask([taskId])).status).to.equal(0); // Open

      // 2. Worker bids
      await escrowAsWorker1.write.bidOnTask([taskId, bidPrice, 3600n]);
      expect((await escrowAsPoster.read.getTask([taskId])).bidCount).to.equal(1n);

      // 3. Poster accepts bid
      await escrowAsPoster.write.acceptBid([taskId, worker1.account.address]);
      expect((await escrowAsPoster.read.getTask([taskId])).status).to.equal(1); // Claimed

      // 4. Worker submits
      const deliverableHash = keccak256(toBytes("completed work"));
      await escrowAsWorker1.write.submitDeliverable([taskId, deliverableHash]);
      expect((await escrowAsPoster.read.getTask([taskId])).status).to.equal(2); // Submitted

      // 5. Poster approves
      const workerBalanceBefore = await usdc.read.balanceOf([worker1.account.address]);
      await escrowAsPoster.write.approveTask([taskId]);
      expect((await escrowAsPoster.read.getTask([taskId])).status).to.equal(3); // Approved

      // Verify payments
      const expectedFee = parseUnits("2", 6); // 2.5% of 80
      const expectedWorkerPayout = bidPrice - expectedFee;

      const workerBalanceAfter = await usdc.read.balanceOf([worker1.account.address]);
      expect(workerBalanceAfter - workerBalanceBefore).to.equal(expectedWorkerPayout);
      expect(await usdc.read.balanceOf([feeRecipient.account.address])).to.equal(expectedFee);
    });
  });
});
