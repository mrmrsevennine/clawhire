import { expect } from "chai";
import hre from "hardhat";
import { parseUnits, keccak256, toBytes, zeroHash } from "viem";
import { describe, it } from "node:test";

describe("TaskEscrowV2", function () {
  const parseUSDC = (n) => parseUnits(String(n), 6);
  const parseHIRE = (n) => parseUnits(String(n), 18);

  function createTaskId(str) {
    return keccak256(toBytes(str));
  }

  async function deployFixture() {
    const nc = await hre.network.connect();
    const [owner, poster, worker1, worker2, feeRecipient, treasury, team] =
      await nc.viem.getWalletClients();
    const publicClient = await nc.viem.getPublicClient();

    // Deploy mock USDC
    const usdc = await nc.viem.deployContract("MockERC20", [
      "USD Coin",
      "USDC",
      6,
    ]);

    // Deploy HireToken
    const hire = await nc.viem.deployContract("HireToken", [
      treasury.account.address,
      team.account.address,
    ]);

    // Deploy TaskEscrowV2
    const escrow = await nc.viem.deployContract("TaskEscrowV2", [
      usdc.address,
      feeRecipient.account.address,
    ]);

    // Wire up: set HireToken on escrow, set escrow as minter on HireToken
    await escrow.write.setHireToken([hire.address]);
    await hire.write.setMinter([escrow.address]);

    // Mint USDC to poster and workers
    const mintAmount = parseUSDC(100_000);
    await usdc.write.mint([poster.account.address, mintAmount]);
    await usdc.write.mint([worker1.account.address, mintAmount]);
    await usdc.write.mint([worker2.account.address, mintAmount]);

    // Transfer HIRE to workers for staking (from treasury)
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
    const usdcAsPoster = await nc.viem.getContractAt("MockERC20", usdc.address, {
      client: { wallet: poster },
    });
    await usdcAsPoster.write.approve([escrow.address, mintAmount]);

    const usdcAsWorker1 = await nc.viem.getContractAt(
      "MockERC20",
      usdc.address,
      { client: { wallet: worker1 } }
    );
    await usdcAsWorker1.write.approve([escrow.address, mintAmount]);

    const usdcAsWorker2 = await nc.viem.getContractAt(
      "MockERC20",
      usdc.address,
      { client: { wallet: worker2 } }
    );
    await usdcAsWorker2.write.approve([escrow.address, mintAmount]);

    // Approve HIRE spending for staking
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

    // Get contract instances for different accounts
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
      escrow,
      escrowAsPoster,
      escrowAsWorker1,
      escrowAsWorker2,
      usdc,
      usdcAsPoster,
      usdcAsWorker1,
      usdcAsWorker2,
      hire,
      hireAsWorker1,
      hireAsWorker2,
      hireAsTreasury,
      owner,
      poster,
      worker1,
      worker2,
      feeRecipient,
      treasury,
      team,
      publicClient,
    };
  }

  // Deploy without HireToken for backward-compat testing
  async function deployWithoutHireFixture() {
    const nc = await hre.network.connect();
    const [owner, poster, worker1, worker2, feeRecipient] =
      await nc.viem.getWalletClients();
    const publicClient = await nc.viem.getPublicClient();

    const usdc = await nc.viem.deployContract("MockERC20", [
      "USD Coin",
      "USDC",
      6,
    ]);

    const escrow = await nc.viem.deployContract("TaskEscrowV2", [
      usdc.address,
      feeRecipient.account.address,
    ]);

    const mintAmount = parseUSDC(100_000);
    await usdc.write.mint([poster.account.address, mintAmount]);
    await usdc.write.mint([worker1.account.address, mintAmount]);

    const usdcAsPoster = await nc.viem.getContractAt("MockERC20", usdc.address, {
      client: { wallet: poster },
    });
    await usdcAsPoster.write.approve([escrow.address, mintAmount]);

    const usdcAsWorker1 = await nc.viem.getContractAt(
      "MockERC20",
      usdc.address,
      { client: { wallet: worker1 } }
    );
    await usdcAsWorker1.write.approve([escrow.address, mintAmount]);

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
      escrow,
      escrowAsPoster,
      escrowAsWorker1,
      escrowAsWorker2,
      usdc,
      owner,
      poster,
      worker1,
      worker2,
      feeRecipient,
      publicClient,
    };
  }

  async function expectRevert(promise, errorSubstring) {
    try {
      await promise;
      expect.fail("Should have reverted");
    } catch (e) {
      if (errorSubstring) {
        expect(e.message).to.include(errorSubstring);
      }
    }
  }

  // =============================================================
  //                    BACKWARD COMPATIBILITY
  // =============================================================
  describe("Backward Compatibility (no HireToken)", function () {
    it("Should create task without HireToken configured", async function () {
      const { escrowAsPoster, poster } = await deployWithoutHireFixture();
      const taskId = createTaskId("compat-1");
      const bounty = parseUSDC(100);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      const task = await escrowAsPoster.read.getTask([taskId]);
      expect(task.poster.toLowerCase()).to.equal(
        poster.account.address.toLowerCase()
      );
      expect(task.bounty).to.equal(bounty);
      expect(task.status).to.equal(0); // Open
    });

    it("Should bid without stake when HireToken not configured", async function () {
      const { escrowAsPoster, escrowAsWorker1 } =
        await deployWithoutHireFixture();
      const taskId = createTaskId("compat-2");
      await escrowAsPoster.write.createTask([taskId, parseUSDC(100)]);
      await escrowAsWorker1.write.bidOnTask([taskId, parseUSDC(80), 3600n]);

      const task = await escrowAsPoster.read.getTask([taskId]);
      expect(task.bidCount).to.equal(1n);
    });

    it("Should complete full lifecycle without HireToken", async function () {
      const { escrowAsPoster, escrowAsWorker1, usdc, worker1, feeRecipient } =
        await deployWithoutHireFixture();
      const taskId = createTaskId("compat-3");
      const bounty = parseUSDC(100);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.claimTask([taskId]);
      await escrowAsWorker1.write.submitDeliverable([
        taskId,
        keccak256(toBytes("work")),
      ]);

      const workerBefore = await usdc.read.balanceOf([
        worker1.account.address,
      ]);
      await escrowAsPoster.write.approveTask([taskId]);
      const workerAfter = await usdc.read.balanceOf([
        worker1.account.address,
      ]);

      const expectedFee = parseUSDC(2.5);
      expect(workerAfter - workerBefore).to.equal(bounty - expectedFee);
    });
  });

  // =============================================================
  //                    STAKE-TO-WORK
  // =============================================================
  describe("Stake-to-Work", function () {
    it("Should require HIRE stake when bidding", async function () {
      const { escrowAsPoster, escrowAsWorker1, hire, worker1 } =
        await deployFixture();
      const taskId = createTaskId("stake-1");
      const bounty = parseUSDC(100); // ≤ 500 USDC → tier 2 = 5000 HIRE

      await escrowAsPoster.write.createTask([taskId, bounty]);

      const hireBefore = await hire.read.balanceOf([worker1.account.address]);
      await escrowAsWorker1.write.bidOnTask([taskId, parseUSDC(80), 3600n]);
      const hireAfter = await hire.read.balanceOf([worker1.account.address]);

      // Task ≤ 500 USDC → 5000 HIRE stake
      expect(hireBefore - hireAfter).to.equal(parseHIRE(5000));
    });

    it("Should revert bid if insufficient HIRE stake", async function () {
      const nc = await hre.network.connect();
      const [owner, poster, poorWorker, , feeRecipient, treasury, team] =
        await nc.viem.getWalletClients();

      const usdc = await nc.viem.deployContract("MockERC20", [
        "USD Coin",
        "USDC",
        6,
      ]);
      const hire = await nc.viem.deployContract("HireToken", [
        treasury.account.address,
        team.account.address,
      ]);
      const escrow = await nc.viem.deployContract("TaskEscrowV2", [
        usdc.address,
        feeRecipient.account.address,
      ]);
      await escrow.write.setHireToken([hire.address]);
      await hire.write.setMinter([escrow.address]);

      await usdc.write.mint([poster.account.address, parseUSDC(10_000)]);

      const usdcAsPoster = await nc.viem.getContractAt(
        "MockERC20",
        usdc.address,
        { client: { wallet: poster } }
      );
      await usdcAsPoster.write.approve([escrow.address, parseUSDC(10_000)]);

      const escrowAsPoster = await nc.viem.getContractAt(
        "TaskEscrowV2",
        escrow.address,
        { client: { wallet: poster } }
      );
      const escrowAsPoor = await nc.viem.getContractAt(
        "TaskEscrowV2",
        escrow.address,
        { client: { wallet: poorWorker } }
      );

      // poorWorker has 0 HIRE
      const taskId = createTaskId("stake-insuf");
      await escrowAsPoster.write.createTask([taskId, parseUSDC(100)]);

      await expectRevert(
        escrowAsPoor.write.bidOnTask([taskId, parseUSDC(80), 3600n])
      );
    });

    it("Should return stake on successful completion", async function () {
      const { escrowAsPoster, escrowAsWorker1, hire, worker1 } =
        await deployFixture();
      const taskId = createTaskId("stake-return-1");
      const bounty = parseUSDC(100);

      const hireBefore = await hire.read.balanceOf([worker1.account.address]);
      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.claimTask([taskId]);

      // Worker's HIRE decreased by stake
      const hireDuring = await hire.read.balanceOf([worker1.account.address]);
      expect(hireBefore - hireDuring).to.equal(parseHIRE(5000));

      await escrowAsWorker1.write.submitDeliverable([
        taskId,
        keccak256(toBytes("work")),
      ]);
      await escrowAsPoster.write.approveTask([taskId]);

      // Stake returned + mining rewards
      const hireAfter = await hire.read.balanceOf([worker1.account.address]);
      expect(hireAfter > hireBefore).to.equal(true); // stake returned + mining
    });

    it("Should return stakes to rejected bidders when bid accepted", async function () {
      const { escrowAsPoster, escrowAsWorker1, escrowAsWorker2, hire, worker1, worker2 } =
        await deployFixture();
      const taskId = createTaskId("stake-return-2");
      const bounty = parseUSDC(100);

      const hire1Before = await hire.read.balanceOf([worker1.account.address]);
      const hire2Before = await hire.read.balanceOf([worker2.account.address]);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.bidOnTask([taskId, parseUSDC(80), 3600n]);
      await escrowAsWorker2.write.bidOnTask([taskId, parseUSDC(90), 7200n]);

      // Both workers staked
      expect(
        await hire.read.balanceOf([worker1.account.address])
      ).to.equal(hire1Before - parseHIRE(5000));
      expect(
        await hire.read.balanceOf([worker2.account.address])
      ).to.equal(hire2Before - parseHIRE(5000));

      // Accept worker1's bid → worker2 should get stake back
      await escrowAsPoster.write.acceptBid([taskId, worker1.account.address]);

      expect(
        await hire.read.balanceOf([worker2.account.address])
      ).to.equal(hire2Before); // worker2 got stake back
    });

    it("Should return correct stake amount per tier", async function () {
      const { escrow } = await deployFixture();
      // <= 50 USDC → 500 HIRE
      expect(await escrow.read.getRequiredStake([parseUSDC(50)])).to.equal(
        parseHIRE(500)
      );
      // <= 500 USDC → 5000 HIRE
      expect(await escrow.read.getRequiredStake([parseUSDC(100)])).to.equal(
        parseHIRE(5000)
      );
      // <= 5000 USDC → 25000 HIRE
      expect(await escrow.read.getRequiredStake([parseUSDC(1000)])).to.equal(
        parseHIRE(25000)
      );
      // > 5000 USDC → 50000 HIRE
      expect(await escrow.read.getRequiredStake([parseUSDC(10000)])).to.equal(
        parseHIRE(50000)
      );
    });
  });

  // =============================================================
  //                    SLASHING
  // =============================================================
  describe("Slashing", function () {
    it("Should slash worker stake on dispute resolution", async function () {
      const { escrow, escrowAsPoster, escrowAsWorker1, hire, poster, worker1, owner } =
        await deployFixture();
      const taskId = createTaskId("slash-1");
      const bounty = parseUSDC(100);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.claimTask([taskId]);
      await escrowAsWorker1.write.submitDeliverable([
        taskId,
        keccak256(toBytes("bad work")),
      ]);
      await escrowAsPoster.write.disputeTask([taskId]);

      const workerHireBefore = await hire.read.balanceOf([
        worker1.account.address,
      ]);
      const posterHireBefore = await hire.read.balanceOf([
        poster.account.address,
      ]);
      const ownerHireBefore = await hire.read.balanceOf([
        owner.account.address,
      ]);

      // Resolve: worker loses
      await escrow.write.resolveDispute([taskId]);

      const workerHireAfter = await hire.read.balanceOf([
        worker1.account.address,
      ]);
      const posterHireAfter = await hire.read.balanceOf([
        poster.account.address,
      ]);
      const ownerHireAfter = await hire.read.balanceOf([
        owner.account.address,
      ]);

      // Stake was 5000 HIRE. 50% slashed = 2500 HIRE.
      // 50% returned = 2500 to worker
      expect(workerHireAfter - workerHireBefore).to.equal(parseHIRE(2500));

      // Of the 2500 slashed: 60% → poster = 1500, 20% → resolver = 500, 20% → burn = 500
      expect(posterHireAfter - posterHireBefore).to.equal(parseHIRE(1500));
      expect(ownerHireAfter - ownerHireBefore).to.equal(parseHIRE(500));
    });

    it("Should distribute slash correctly (60/20/20)", async function () {
      const { escrow, escrowAsPoster, escrowAsWorker1, hire, poster, owner } =
        await deployFixture();
      const taskId = createTaskId("slash-dist");
      const bounty = parseUSDC(100);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.claimTask([taskId]);
      await escrowAsWorker1.write.submitDeliverable([
        taskId,
        keccak256(toBytes("bad")),
      ]);
      await escrowAsPoster.write.disputeTask([taskId]);

      const supplyBefore = await hire.read.totalSupply();
      await escrow.write.resolveDispute([taskId]);
      const supplyAfter = await hire.read.totalSupply();

      // 500 HIRE was burned (20% of 2500 slash)
      expect(supplyBefore - supplyAfter).to.equal(parseHIRE(500));
    });
  });

  // =============================================================
  //                    FLASH TASKS
  // =============================================================
  describe("Flash Tasks", function () {
    it("Should create flash task with expected hash", async function () {
      const { escrowAsPoster, poster } = await deployFixture();
      const taskId = createTaskId("flash-1");
      const bounty = parseUSDC(50);
      const expectedHash = keccak256(toBytes("correct answer"));

      await escrowAsPoster.write.createFlashTask([
        taskId,
        bounty,
        expectedHash,
      ]);

      const task = await escrowAsPoster.read.getTask([taskId]);
      expect(task.poster.toLowerCase()).to.equal(
        poster.account.address.toLowerCase()
      );
      expect(task.bounty).to.equal(bounty);
      expect(task.taskType).to.equal(1); // Flash
      expect(task.expectedResultHash).to.equal(expectedHash);
    });

    it("Should pay worker instantly on correct hash", async function () {
      const { escrowAsPoster, escrowAsWorker1, usdc, worker1 } =
        await deployFixture();
      const taskId = createTaskId("flash-2");
      const bounty = parseUSDC(50);
      const answer = "correct answer";
      const expectedHash = keccak256(toBytes(answer));

      await escrowAsPoster.write.createFlashTask([
        taskId,
        bounty,
        expectedHash,
      ]);

      const workerBefore = await usdc.read.balanceOf([
        worker1.account.address,
      ]);
      await escrowAsWorker1.write.completeFlashTask([taskId, expectedHash]);
      const workerAfter = await usdc.read.balanceOf([
        worker1.account.address,
      ]);

      // 50 USDC - 2.5% fee = 48.75 USDC
      const expectedFee = parseUSDC(1.25);
      expect(workerAfter - workerBefore).to.equal(bounty - expectedFee);

      const task = await escrowAsPoster.read.getTask([taskId]);
      expect(task.status).to.equal(3); // Approved
    });

    it("Should revert flash task on wrong hash", async function () {
      const { escrowAsPoster, escrowAsWorker1 } = await deployFixture();
      const taskId = createTaskId("flash-3");
      const bounty = parseUSDC(50);
      const expectedHash = keccak256(toBytes("correct answer"));
      const wrongHash = keccak256(toBytes("wrong answer"));

      await escrowAsPoster.write.createFlashTask([
        taskId,
        bounty,
        expectedHash,
      ]);

      await expectRevert(
        escrowAsWorker1.write.completeFlashTask([taskId, wrongHash]),
        "InvalidResultHash"
      );
    });

    it("Should trigger work mining on flash task completion", async function () {
      const { escrowAsPoster, escrowAsWorker1, hire, worker1, poster } =
        await deployFixture();
      const taskId = createTaskId("flash-mine");
      const bounty = parseUSDC(50);
      const expectedHash = keccak256(toBytes("answer"));

      const workerHireBefore = await hire.read.balanceOf([
        worker1.account.address,
      ]);
      const posterHireBefore = await hire.read.balanceOf([
        poster.account.address,
      ]);

      await escrowAsPoster.write.createFlashTask([
        taskId,
        bounty,
        expectedHash,
      ]);
      await escrowAsWorker1.write.completeFlashTask([taskId, expectedHash]);

      const workerHireAfter = await hire.read.balanceOf([
        worker1.account.address,
      ]);
      const posterHireAfter = await hire.read.balanceOf([
        poster.account.address,
      ]);

      // 50 USDC * 10 rate = 500 HIRE total
      // Worker 80% = 400 HIRE, Poster 20% = 100 HIRE
      expect(workerHireAfter - workerHireBefore).to.equal(parseHIRE(400));
      expect(posterHireAfter - posterHireBefore).to.equal(parseHIRE(100));
    });

    it("Should revert completing a non-flash task", async function () {
      const { escrowAsPoster, escrowAsWorker1 } = await deployFixture();
      const taskId = createTaskId("flash-notflash");
      await escrowAsPoster.write.createTask([taskId, parseUSDC(100)]);

      await expectRevert(
        escrowAsWorker1.write.completeFlashTask([
          taskId,
          keccak256(toBytes("x")),
        ]),
        "NotFlashTask"
      );
    });
  });

  // =============================================================
  //                    WORK MINING ON STANDARD TASKS
  // =============================================================
  describe("Work Mining on Standard Tasks", function () {
    it("Should trigger work mining on approveTask", async function () {
      const { escrowAsPoster, escrowAsWorker1, hire, worker1, poster } =
        await deployFixture();
      const taskId = createTaskId("mine-std-1");
      const bounty = parseUSDC(100);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.claimTask([taskId]);
      await escrowAsWorker1.write.submitDeliverable([
        taskId,
        keccak256(toBytes("work")),
      ]);

      const workerHireBefore = await hire.read.balanceOf([
        worker1.account.address,
      ]);
      await escrowAsPoster.write.approveTask([taskId]);
      const workerHireAfter = await hire.read.balanceOf([
        worker1.account.address,
      ]);

      // Worker gets stake back (5000 HIRE) + 80% of mining (100 * 10 * 0.8 = 800 HIRE)
      // Total HIRE increase = 5000 + 800 = 5800
      expect(workerHireAfter - workerHireBefore).to.equal(parseHIRE(5800));
    });
  });

  // =============================================================
  //                    TASK FORKS (Parent/Child)
  // =============================================================
  describe("Task Forks", function () {
    it("Should create parent + 3 sub-tasks", async function () {
      const { escrowAsPoster, escrowAsWorker1 } = await deployFixture();
      const parentId = createTaskId("fork-parent-1");
      const sub1 = createTaskId("fork-sub-1");
      const sub2 = createTaskId("fork-sub-2");
      const sub3 = createTaskId("fork-sub-3");

      await escrowAsPoster.write.createTask([parentId, parseUSDC(100)]);
      await escrowAsWorker1.write.claimTask([parentId]);

      // Worker1 creates 3 subtasks
      await escrowAsWorker1.write.createSubtask([parentId, sub1, parseUSDC(10)]);
      await escrowAsWorker1.write.createSubtask([parentId, sub2, parseUSDC(10)]);
      await escrowAsWorker1.write.createSubtask([parentId, sub3, parseUSDC(10)]);

      const children = await escrowAsPoster.read.getSubtasks([parentId]);
      expect(children.length).to.equal(3);
    });

    it("Should prevent 3rd level (grandchildren)", async function () {
      const { escrowAsPoster, escrowAsWorker1, escrowAsWorker2 } =
        await deployFixture();
      const parentId = createTaskId("fork-gc-parent");
      const childId = createTaskId("fork-gc-child");
      const grandchildId = createTaskId("fork-gc-grandchild");

      await escrowAsPoster.write.createTask([parentId, parseUSDC(100)]);
      await escrowAsWorker1.write.claimTask([parentId]);
      await escrowAsWorker1.write.createSubtask([
        parentId,
        childId,
        parseUSDC(20),
      ]);

      // Worker2 claims child, then tries to create grandchild
      await escrowAsWorker2.write.claimTask([childId]);

      await expectRevert(
        escrowAsWorker2.write.createSubtask([
          childId,
          grandchildId,
          parseUSDC(5),
        ]),
        "Max 2 levels"
      );
    });

    it("Should pay orchestrator fee on subtask completion", async function () {
      const {
        escrowAsPoster,
        escrowAsWorker1,
        escrowAsWorker2,
        usdc,
        worker1,
      } = await deployFixture();
      const parentId = createTaskId("fork-orch-parent");
      const childId = createTaskId("fork-orch-child");

      await escrowAsPoster.write.createTask([parentId, parseUSDC(100)]);
      await escrowAsWorker1.write.claimTask([parentId]);
      await escrowAsWorker1.write.createSubtask([
        parentId,
        childId,
        parseUSDC(100),
      ]);

      // Worker2 claims and completes the subtask
      await escrowAsWorker2.write.claimTask([childId]);
      await escrowAsWorker2.write.submitDeliverable([
        childId,
        keccak256(toBytes("child work")),
      ]);

      // Worker1 (orchestrator) should get 10% fee
      const worker1Before = await usdc.read.balanceOf([
        worker1.account.address,
      ]);

      // Worker1 is the subtask poster, so they approve
      const nc = await hre.network.connect();
      const escrowAsWorker1Poster = await nc.viem.getContractAt(
        "TaskEscrowV2",
        escrowAsWorker1.address,
        { client: { wallet: worker1 } }
      );
      // Actually escrowAsWorker1 IS the poster of the subtask (worker1 created it)
      await escrowAsWorker1.write.approveTask([childId]);

      const worker1After = await usdc.read.balanceOf([
        worker1.account.address,
      ]);

      // Orchestrator fee: 10% of 100 USDC = 10 USDC
      expect(worker1After - worker1Before).to.equal(parseUSDC(10));
    });

    it("Should auto-complete parent when all subtasks done", async function () {
      const { escrowAsPoster, escrowAsWorker1, escrowAsWorker2 } =
        await deployFixture();
      const parentId = createTaskId("fork-auto-parent");
      const child1 = createTaskId("fork-auto-child1");
      const child2 = createTaskId("fork-auto-child2");

      await escrowAsPoster.write.createTask([parentId, parseUSDC(100)]);
      await escrowAsWorker1.write.claimTask([parentId]);

      // Create 2 subtasks
      await escrowAsWorker1.write.createSubtask([
        parentId,
        child1,
        parseUSDC(20),
      ]);
      await escrowAsWorker1.write.createSubtask([
        parentId,
        child2,
        parseUSDC(20),
      ]);

      // Complete child 1
      await escrowAsWorker2.write.claimTask([child1]);
      await escrowAsWorker2.write.submitDeliverable([
        child1,
        keccak256(toBytes("c1")),
      ]);
      await escrowAsWorker1.write.approveTask([child1]);

      // Parent not yet complete
      let parent = await escrowAsPoster.read.getTask([parentId]);
      expect(parent.status).to.equal(1); // Still Claimed

      // Complete child 2
      await escrowAsWorker2.write.claimTask([child2]);
      await escrowAsWorker2.write.submitDeliverable([
        child2,
        keccak256(toBytes("c2")),
      ]);
      await escrowAsWorker1.write.approveTask([child2]);

      // Parent auto-completed
      parent = await escrowAsPoster.read.getTask([parentId]);
      expect(parent.status).to.equal(3); // Approved
    });

    it("Should report subtask status correctly", async function () {
      const { escrowAsPoster, escrowAsWorker1, escrowAsWorker2 } =
        await deployFixture();
      const parentId = createTaskId("fork-status-parent");
      const child1 = createTaskId("fork-status-c1");
      const child2 = createTaskId("fork-status-c2");
      const child3 = createTaskId("fork-status-c3");

      await escrowAsPoster.write.createTask([parentId, parseUSDC(100)]);
      await escrowAsWorker1.write.claimTask([parentId]);

      await escrowAsWorker1.write.createSubtask([
        parentId,
        child1,
        parseUSDC(10),
      ]);
      await escrowAsWorker1.write.createSubtask([
        parentId,
        child2,
        parseUSDC(10),
      ]);
      await escrowAsWorker1.write.createSubtask([
        parentId,
        child3,
        parseUSDC(10),
      ]);

      // Complete child1
      await escrowAsWorker2.write.claimTask([child1]);
      await escrowAsWorker2.write.submitDeliverable([
        child1,
        keccak256(toBytes("c1")),
      ]);
      await escrowAsWorker1.write.approveTask([child1]);

      // Cancel child2
      await escrowAsWorker1.write.cancelSubtask([child2]);

      const [total, completed, failed, pending] =
        await escrowAsPoster.read.getSubtaskStatus([parentId]);
      expect(total).to.equal(3n);
      expect(completed).to.equal(1n);
      expect(failed).to.equal(1n);
      expect(pending).to.equal(1n);
    });

    it("Should only allow orchestrator to cancel subtask", async function () {
      const { escrowAsPoster, escrowAsWorker1, escrowAsWorker2 } =
        await deployFixture();
      const parentId = createTaskId("fork-cancel-parent");
      const childId = createTaskId("fork-cancel-child");

      await escrowAsPoster.write.createTask([parentId, parseUSDC(100)]);
      await escrowAsWorker1.write.claimTask([parentId]);
      await escrowAsWorker1.write.createSubtask([
        parentId,
        childId,
        parseUSDC(10),
      ]);

      // Worker2 (not orchestrator) tries to cancel
      await expectRevert(
        escrowAsWorker2.write.cancelSubtask([childId]),
        "Only orchestrator"
      );
    });

    it("Should calculate orchestrator fee correctly (10%)", async function () {
      const { escrow } = await deployFixture();
      expect(await escrow.read.orchestratorFeeBps()).to.equal(1000n); // 10%
    });
  });

  // =============================================================
  //                    EXISTING REGRESSION TESTS
  // =============================================================
  describe("Regression: Core Lifecycle", function () {
    it("Should set correct USDC address", async function () {
      const { escrow, usdc } = await deployFixture();
      expect((await escrow.read.usdc()).toLowerCase()).to.equal(
        usdc.address.toLowerCase()
      );
    });

    it("Should set correct fee recipient", async function () {
      const { escrow, feeRecipient } = await deployFixture();
      expect(
        (await escrow.read.feeRecipient()).toLowerCase()
      ).to.equal(feeRecipient.account.address.toLowerCase());
    });

    it("Should set initial platform fee to 2.5%", async function () {
      const { escrow } = await deployFixture();
      expect(await escrow.read.platformFeeBps()).to.equal(250n);
    });

    it("Should create task with correct bounty", async function () {
      const { escrowAsPoster, poster } = await deployFixture();
      const taskId = createTaskId("reg-create");
      const bounty = parseUSDC(100);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      const task = await escrowAsPoster.read.getTask([taskId]);
      expect(task.bounty).to.equal(bounty);
      expect(task.status).to.equal(0);
    });

    it("Should pay worker and collect 2.5% fee", async function () {
      const { escrowAsPoster, escrowAsWorker1, usdc, worker1, feeRecipient } =
        await deployFixture();
      const taskId = createTaskId("reg-fee");
      const bounty = parseUSDC(100);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.claimTask([taskId]);
      await escrowAsWorker1.write.submitDeliverable([
        taskId,
        keccak256(toBytes("work")),
      ]);

      const feeRecipientBefore = await usdc.read.balanceOf([
        feeRecipient.account.address,
      ]);
      await escrowAsPoster.write.approveTask([taskId]);
      const feeRecipientAfter = await usdc.read.balanceOf([
        feeRecipient.account.address,
      ]);

      expect(feeRecipientAfter - feeRecipientBefore).to.equal(
        parseUSDC(2.5)
      );
    });

    it("Should allow poster to dispute within window", async function () {
      const { escrowAsPoster, escrowAsWorker1 } = await deployFixture();
      const taskId = createTaskId("reg-dispute");
      await escrowAsPoster.write.createTask([taskId, parseUSDC(100)]);
      await escrowAsWorker1.write.claimTask([taskId]);
      await escrowAsWorker1.write.submitDeliverable([
        taskId,
        keccak256(toBytes("work")),
      ]);
      await escrowAsPoster.write.disputeTask([taskId]);

      const task = await escrowAsPoster.read.getTask([taskId]);
      expect(task.status).to.equal(4); // Disputed
    });

    it("Should allow poster to cancel open task", async function () {
      const { escrowAsPoster, usdc, poster } = await deployFixture();
      const taskId = createTaskId("reg-cancel");
      const bounty = parseUSDC(100);

      await escrowAsPoster.write.createTask([taskId, bounty]);
      const before = await usdc.read.balanceOf([poster.account.address]);
      await escrowAsPoster.write.cancelTask([taskId]);
      const after = await usdc.read.balanceOf([poster.account.address]);

      expect(after - before).to.equal(bounty);
    });

    it("Should track reputation on task completion", async function () {
      const { escrowAsPoster, escrowAsWorker1, worker1 } =
        await deployFixture();
      const taskId = createTaskId("reg-rep");
      await escrowAsPoster.write.createTask([taskId, parseUSDC(100)]);
      await escrowAsWorker1.write.claimTask([taskId]);
      await escrowAsWorker1.write.submitDeliverable([
        taskId,
        keccak256(toBytes("work")),
      ]);
      await escrowAsPoster.write.approveTask([taskId]);

      const rep = await escrowAsPoster.read.getReputation([
        worker1.account.address,
      ]);
      expect(rep.tasksCompleted).to.equal(1n);
    });

    it("Should prevent poster from bidding own task", async function () {
      const { escrowAsPoster } = await deployFixture();
      const taskId = createTaskId("reg-selfbid");
      await escrowAsPoster.write.createTask([taskId, parseUSDC(100)]);
      await expectRevert(
        escrowAsPoster.write.bidOnTask([taskId, parseUSDC(80), 3600n]),
        "PosterCannotBidOwnTask"
      );
    });

    it("Should return bidder stakes when task is cancelled", async function () {
      const { escrowAsPoster, escrowAsWorker1, hire, worker1 } =
        await deployFixture();
      const taskId = createTaskId("reg-cancel-stake");
      const bounty = parseUSDC(100);

      const hireBefore = await hire.read.balanceOf([worker1.account.address]);
      await escrowAsPoster.write.createTask([taskId, bounty]);
      await escrowAsWorker1.write.bidOnTask([taskId, parseUSDC(80), 3600n]);

      // Stake deducted
      const hireDuring = await hire.read.balanceOf([worker1.account.address]);
      expect(hireBefore - hireDuring).to.equal(parseHIRE(5000));

      // Cancel task → stake returned
      await escrowAsPoster.write.cancelTask([taskId]);
      const hireAfter = await hire.read.balanceOf([worker1.account.address]);
      expect(hireAfter).to.equal(hireBefore);
    });
  });

  // =============================================================
  //                    ADMIN
  // =============================================================
  describe("Admin", function () {
    it("Should allow owner to update fee", async function () {
      const { escrow } = await deployFixture();
      await escrow.write.setFee([500n]);
      expect(await escrow.read.platformFeeBps()).to.equal(500n);
    });

    it("Should revert if fee too high", async function () {
      const { escrow } = await deployFixture();
      await expectRevert(escrow.write.setFee([1500n]), "FeeTooHigh");
    });

    it("Should allow setting orchestrator fee", async function () {
      const { escrow } = await deployFixture();
      await escrow.write.setOrchestratorFeeBps([2000n]);
      expect(await escrow.read.orchestratorFeeBps()).to.equal(2000n);
    });
  });

  // =============================================================
  //                    PAUSABLE
  // =============================================================
  describe("Pausable", function () {
    it("Should block task creation when paused", async function () {
      const { escrow, escrowAsPoster } = await deployFixture();
      await escrow.write.pause();
      await expectRevert(
        escrowAsPoster.write.createTask([
          createTaskId("paused"),
          parseUSDC(10),
        ]),
        "EnforcedPause"
      );
    });

    it("Should allow after unpause", async function () {
      const { escrow, escrowAsPoster } = await deployFixture();
      await escrow.write.pause();
      await escrow.write.unpause();
      await escrowAsPoster.write.createTask([
        createTaskId("unpaused"),
        parseUSDC(10),
      ]);
      const task = await escrowAsPoster.read.getTask([
        createTaskId("unpaused"),
      ]);
      expect(task.status).to.equal(0);
    });
  });
});
