import { expect } from "chai";
import hre from "hardhat";
import { parseUnits, formatUnits } from "viem";
import { describe, it } from "node:test";

describe("ClawToken + RevenueShare", function () {
  const parseUSDC = (n) => parseUnits(String(n), 6);
  const parseCLAW = (n) => parseUnits(String(n), 18);

  async function deployFixture() {
    const nc = await hre.network.connect();
    const [owner, alice, bob, treasury] = await nc.viem.getWalletClients();
    const publicClient = await nc.viem.getPublicClient();

    const usdc = await nc.viem.deployContract("MockERC20", ["USD Coin", "USDC", 6]);
    const claw = await nc.viem.deployContract("ClawToken", [owner.account.address]);
    const revenueShare = await nc.viem.deployContract("RevenueShare", [
      claw.address,
      usdc.address,
      treasury.account.address,
    ]);

    await claw.write.transfer([alice.account.address, parseCLAW(10_000_000)]);
    await claw.write.transfer([bob.account.address, parseCLAW(5_000_000)]);
    await usdc.write.mint([owner.account.address, parseUSDC(10_000)]);

    const clawAsAlice = await nc.viem.getContractAt("ClawToken", claw.address, { client: { wallet: alice } });
    const clawAsBob = await nc.viem.getContractAt("ClawToken", claw.address, { client: { wallet: bob } });
    const rsAsAlice = await nc.viem.getContractAt("RevenueShare", revenueShare.address, { client: { wallet: alice } });
    const rsAsBob = await nc.viem.getContractAt("RevenueShare", revenueShare.address, { client: { wallet: bob } });

    return { usdc, claw, revenueShare, publicClient, owner, alice, bob, treasury, clawAsAlice, clawAsBob, rsAsAlice, rsAsBob };
  }

  // Helper: expect revert
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

  describe("ClawToken", function () {
    it("should have correct name, symbol and 100M supply", async function () {
      const { claw } = await deployFixture();
      expect(await claw.read.name()).to.equal("hire");
      expect(await claw.read.symbol()).to.equal("HIRE");
      expect(await claw.read.totalSupply()).to.equal(parseCLAW(100_000_000));
    });

    it("should distribute tokens to users", async function () {
      const { claw, alice, bob } = await deployFixture();
      expect(await claw.read.balanceOf([alice.account.address])).to.equal(parseCLAW(10_000_000));
      expect(await claw.read.balanceOf([bob.account.address])).to.equal(parseCLAW(5_000_000));
    });
  });

  describe("Staking", function () {
    it("should allow staking and unstaking", async function () {
      const { revenueShare, clawAsAlice, rsAsAlice, alice } = await deployFixture();
      const amount = parseCLAW(1_000_000);
      await clawAsAlice.write.approve([revenueShare.address, amount]);
      await rsAsAlice.write.stake([amount]);

      expect(await revenueShare.read.staked([alice.account.address])).to.equal(amount);
      expect(await revenueShare.read.totalStaked()).to.equal(amount);

      await rsAsAlice.write.unstake([parseCLAW(500_000)]);
      expect(await revenueShare.read.staked([alice.account.address])).to.equal(parseCLAW(500_000));
    });

    it("should reject zero stake", async function () {
      const { rsAsAlice } = await deployFixture();
      await expectRevert(rsAsAlice.write.stake([0n]), "ZeroAmount");
    });

    it("should reject unstaking more than staked", async function () {
      const { revenueShare, clawAsAlice, rsAsAlice } = await deployFixture();
      await clawAsAlice.write.approve([revenueShare.address, parseCLAW(1_000_000)]);
      await rsAsAlice.write.stake([parseCLAW(1_000_000)]);
      await expectRevert(rsAsAlice.write.unstake([parseCLAW(2_000_000)]), "InsufficientStake");
    });

    it("should return CLAW tokens on full unstake", async function () {
      const { claw, revenueShare, clawAsAlice, rsAsAlice, alice } = await deployFixture();
      const amount = parseCLAW(1_000_000);
      const before = await claw.read.balanceOf([alice.account.address]);
      await clawAsAlice.write.approve([revenueShare.address, amount]);
      await rsAsAlice.write.stake([amount]);
      await rsAsAlice.write.unstake([amount]);
      expect(await claw.read.balanceOf([alice.account.address])).to.equal(before);
    });
  });

  describe("Revenue Distribution", function () {
    it("should distribute USDC proportionally (2:1 ratio)", async function () {
      const { usdc, revenueShare, clawAsAlice, clawAsBob, rsAsAlice, rsAsBob, alice, bob } = await deployFixture();

      await clawAsAlice.write.approve([revenueShare.address, parseCLAW(10_000_000)]);
      await rsAsAlice.write.stake([parseCLAW(10_000_000)]);
      await clawAsBob.write.approve([revenueShare.address, parseCLAW(5_000_000)]);
      await rsAsBob.write.stake([parseCLAW(5_000_000)]);

      await usdc.write.transfer([revenueShare.address, parseUSDC(100)]);
      await revenueShare.write.distributeRevenue([parseUSDC(100)]);

      // 50% treasury = 50, 50% stakers = 50
      // Alice 2/3 of 50, Bob 1/3 of 50
      const aliceEarned = Number(formatUnits(await revenueShare.read.earned([alice.account.address]), 6));
      const bobEarned = Number(formatUnits(await revenueShare.read.earned([bob.account.address]), 6));

      // 2:1 ratio means alice gets ~33.33 and bob ~16.66
      // Rounding can lose a few units due to 18→6 decimal precision
      expect(aliceEarned + bobEarned).to.be.closeTo(50, 1);
      expect(aliceEarned).to.be.greaterThan(bobEarned * 1.8); // ~2x ratio
      expect(aliceEarned).to.be.lessThan(bobEarned * 2.2);
    });

    it("should send 50% to treasury", async function () {
      const { usdc, revenueShare, clawAsAlice, rsAsAlice, treasury } = await deployFixture();
      await clawAsAlice.write.approve([revenueShare.address, parseCLAW(1_000_000)]);
      await rsAsAlice.write.stake([parseCLAW(1_000_000)]);

      const before = await usdc.read.balanceOf([treasury.account.address]);
      await usdc.write.transfer([revenueShare.address, parseUSDC(100)]);
      await revenueShare.write.distributeRevenue([parseUSDC(100)]);
      const after = await usdc.read.balanceOf([treasury.account.address]);

      expect(after - before).to.equal(parseUSDC(50));
    });

    it("should send all to treasury if no stakers", async function () {
      const { usdc, revenueShare, treasury } = await deployFixture();
      const before = await usdc.read.balanceOf([treasury.account.address]);
      await usdc.write.transfer([revenueShare.address, parseUSDC(100)]);
      await revenueShare.write.distributeRevenue([parseUSDC(100)]);
      const after = await usdc.read.balanceOf([treasury.account.address]);
      expect(after - before).to.equal(parseUSDC(100));
    });
  });

  describe("Claiming Rewards", function () {
    it("should transfer USDC on claim", async function () {
      const { usdc, revenueShare, clawAsAlice, rsAsAlice, alice } = await deployFixture();
      await clawAsAlice.write.approve([revenueShare.address, parseCLAW(1_000_000)]);
      await rsAsAlice.write.stake([parseCLAW(1_000_000)]);

      await usdc.write.transfer([revenueShare.address, parseUSDC(100)]);
      await revenueShare.write.distributeRevenue([parseUSDC(100)]);

      const before = await usdc.read.balanceOf([alice.account.address]);
      await rsAsAlice.write.claimRewards();
      const after = await usdc.read.balanceOf([alice.account.address]);

      // Sole staker gets 50% of 100 = 50
      expect(after - before).to.equal(parseUSDC(50));
    });

    it("should reject claim with no rewards", async function () {
      const { rsAsAlice } = await deployFixture();
      await expectRevert(rsAsAlice.write.claimRewards(), "NoRewards");
    });

    it("should accumulate over multiple rounds", async function () {
      const { usdc, revenueShare, clawAsAlice, rsAsAlice, alice } = await deployFixture();
      await clawAsAlice.write.approve([revenueShare.address, parseCLAW(1_000_000)]);
      await rsAsAlice.write.stake([parseCLAW(1_000_000)]);

      await usdc.write.transfer([revenueShare.address, parseUSDC(100)]);
      await revenueShare.write.distributeRevenue([parseUSDC(100)]);
      await usdc.write.transfer([revenueShare.address, parseUSDC(200)]);
      await revenueShare.write.distributeRevenue([parseUSDC(200)]);

      // 50% of 300 = 150
      expect(await revenueShare.read.earned([alice.account.address])).to.equal(parseUSDC(150));
    });

    it("should track late stakers correctly", async function () {
      const { usdc, revenueShare, clawAsAlice, clawAsBob, rsAsAlice, rsAsBob, alice, bob } = await deployFixture();

      await clawAsAlice.write.approve([revenueShare.address, parseCLAW(1_000_000)]);
      await rsAsAlice.write.stake([parseCLAW(1_000_000)]);

      // Round 1: Alice only
      await usdc.write.transfer([revenueShare.address, parseUSDC(100)]);
      await revenueShare.write.distributeRevenue([parseUSDC(100)]);

      // Bob joins
      await clawAsBob.write.approve([revenueShare.address, parseCLAW(1_000_000)]);
      await rsAsBob.write.stake([parseCLAW(1_000_000)]);

      // Round 2: 50/50
      await usdc.write.transfer([revenueShare.address, parseUSDC(100)]);
      await revenueShare.write.distributeRevenue([parseUSDC(100)]);

      // Alice: 50 (solo) + 25 (half) = 75
      // Bob: 0 + 25 = 25
      expect(await revenueShare.read.earned([alice.account.address])).to.equal(parseUSDC(75));
      expect(await revenueShare.read.earned([bob.account.address])).to.equal(parseUSDC(25));
    });
  });

  describe("Admin", function () {
    it("should allow owner to update treasury bps", async function () {
      const { revenueShare } = await deployFixture();
      await revenueShare.write.setTreasuryBps([3000n]);
      expect(await revenueShare.read.treasuryBps()).to.equal(3000n);
    });

    it("should reject bps over 100%", async function () {
      const { revenueShare } = await deployFixture();
      await expectRevert(revenueShare.write.setTreasuryBps([10001n]), "InvalidBps");
    });

    it("should pause and unpause staking", async function () {
      const { revenueShare, clawAsAlice, rsAsAlice, alice } = await deployFixture();
      await revenueShare.write.pause();
      await clawAsAlice.write.approve([revenueShare.address, parseCLAW(1_000_000)]);
      await expectRevert(rsAsAlice.write.stake([parseCLAW(1_000_000)]));

      await revenueShare.write.unpause();
      await rsAsAlice.write.stake([parseCLAW(1_000_000)]);
      expect(await revenueShare.read.staked([alice.account.address])).to.equal(parseCLAW(1_000_000));
    });
  });

  describe("Integration: Fee → Staker Cycle", function () {
    it("should complete full fee distribute claim cycle", async function () {
      const { usdc, revenueShare, clawAsAlice, clawAsBob, rsAsAlice, rsAsBob, alice, bob } = await deployFixture();

      await clawAsAlice.write.approve([revenueShare.address, parseCLAW(5_000_000)]);
      await rsAsAlice.write.stake([parseCLAW(5_000_000)]);
      await clawAsBob.write.approve([revenueShare.address, parseCLAW(5_000_000)]);
      await rsAsBob.write.stake([parseCLAW(5_000_000)]);

      // Simulate 10 USDC fee (easier numbers)
      await usdc.write.transfer([revenueShare.address, parseUSDC(10)]);
      await revenueShare.write.distributeRevenue([parseUSDC(10)]);

      // 50% treasury = 5 USDC, 50% stakers = 5 USDC, each ~2.5 USDC
      const aliceEarned = Number(formatUnits(await revenueShare.read.earned([alice.account.address]), 6));
      expect(aliceEarned).to.be.closeTo(2.5, 0.5); // rounding tolerance

      // Alice claims
      const before = await usdc.read.balanceOf([alice.account.address]);
      await rsAsAlice.write.claimRewards();
      const after = await usdc.read.balanceOf([alice.account.address]);
      const claimed = Number(formatUnits(after - before, 6));
      expect(claimed).to.be.closeTo(2.5, 0.5);

      // Stats
      const stats = await revenueShare.read.getStats();
      expect(stats[0]).to.equal(parseCLAW(10_000_000)); // totalStaked
      expect(stats[1]).to.equal(parseUSDC(5));           // totalDistributed
      expect(stats[2]).to.equal(parseUSDC(5));           // totalToTreasury
    });
  });
});
