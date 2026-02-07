import { expect } from "chai";
import hre from "hardhat";
import { parseUnits, formatUnits } from "viem";
import { describe, it } from "node:test";

describe("RevenueShareV2", function () {
  const parseUSDC = (n) => parseUnits(String(n), 6);
  const parseHIRE = (n) => parseUnits(String(n), 18);

  async function deployFixture() {
    const nc = await hre.network.connect();
    const [owner, alice, bob, treasuryWallet, team] =
      await nc.viem.getWalletClients();
    const publicClient = await nc.viem.getPublicClient();

    const usdc = await nc.viem.deployContract("MockERC20", [
      "USD Coin",
      "USDC",
      6,
    ]);

    // Deploy HireToken with treasury + team
    const hire = await nc.viem.deployContract("HireToken", [
      treasuryWallet.account.address,
      team.account.address,
    ]);

    const revenueShare = await nc.viem.deployContract("RevenueShareV2", [
      hire.address,
      usdc.address,
      treasuryWallet.account.address,
    ]);

    // Transfer HIRE from treasury to alice and bob for staking
    const hireAsTreasury = await nc.viem.getContractAt(
      "HireToken",
      hire.address,
      { client: { wallet: treasuryWallet } }
    );
    await hireAsTreasury.write.transfer([
      alice.account.address,
      parseHIRE(10_000_000),
    ]);
    await hireAsTreasury.write.transfer([
      bob.account.address,
      parseHIRE(5_000_000),
    ]);

    // Mint USDC to owner for distribution
    await usdc.write.mint([owner.account.address, parseUSDC(100_000)]);

    // Get contract instances
    const hireAsAlice = await nc.viem.getContractAt("HireToken", hire.address, {
      client: { wallet: alice },
    });
    const hireAsBob = await nc.viem.getContractAt("HireToken", hire.address, {
      client: { wallet: bob },
    });
    const rsAsAlice = await nc.viem.getContractAt(
      "RevenueShareV2",
      revenueShare.address,
      { client: { wallet: alice } }
    );
    const rsAsBob = await nc.viem.getContractAt(
      "RevenueShareV2",
      revenueShare.address,
      { client: { wallet: bob } }
    );

    return {
      usdc,
      hire,
      revenueShare,
      publicClient,
      owner,
      alice,
      bob,
      treasuryWallet,
      team,
      hireAsAlice,
      hireAsBob,
      hireAsTreasury,
      rsAsAlice,
      rsAsBob,
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

  describe("Configuration", function () {
    it("should have correct default splits (30% treasury, 20% burn)", async function () {
      const { revenueShare } = await deployFixture();
      expect(await revenueShare.read.treasuryBps()).to.equal(3000n);
      expect(await revenueShare.read.burnBps()).to.equal(2000n);
    });

    it("should use HIRE token for staking", async function () {
      const { revenueShare, hire } = await deployFixture();
      expect(
        (await revenueShare.read.hireToken()).toLowerCase()
      ).to.equal(hire.address.toLowerCase());
    });
  });

  describe("Staking", function () {
    it("should allow staking and unstaking", async function () {
      const { revenueShare, hireAsAlice, rsAsAlice, alice } =
        await deployFixture();
      const amount = parseHIRE(1_000_000);
      await hireAsAlice.write.approve([revenueShare.address, amount]);
      await rsAsAlice.write.stake([amount]);

      expect(
        await revenueShare.read.staked([alice.account.address])
      ).to.equal(amount);
      expect(await revenueShare.read.totalStaked()).to.equal(amount);

      await rsAsAlice.write.unstake([parseHIRE(500_000)]);
      expect(
        await revenueShare.read.staked([alice.account.address])
      ).to.equal(parseHIRE(500_000));
    });

    it("should reject zero stake", async function () {
      const { rsAsAlice } = await deployFixture();
      await expectRevert(rsAsAlice.write.stake([0n]), "ZeroAmount");
    });

    it("should reject unstaking more than staked", async function () {
      const { revenueShare, hireAsAlice, rsAsAlice } = await deployFixture();
      await hireAsAlice.write.approve([
        revenueShare.address,
        parseHIRE(1_000_000),
      ]);
      await rsAsAlice.write.stake([parseHIRE(1_000_000)]);
      await expectRevert(
        rsAsAlice.write.unstake([parseHIRE(2_000_000)]),
        "InsufficientStake"
      );
    });
  });

  describe("Revenue Distribution (50/30/20 split)", function () {
    it("should split revenue 50% stakers, 30% treasury, 20% burn", async function () {
      const {
        usdc,
        revenueShare,
        hireAsAlice,
        rsAsAlice,
        alice,
        treasuryWallet,
      } = await deployFixture();
      await hireAsAlice.write.approve([
        revenueShare.address,
        parseHIRE(1_000_000),
      ]);
      await rsAsAlice.write.stake([parseHIRE(1_000_000)]);

      const treasuryBefore = await usdc.read.balanceOf([
        treasuryWallet.account.address,
      ]);

      await usdc.write.transfer([revenueShare.address, parseUSDC(100)]);
      await revenueShare.write.distributeRevenue([parseUSDC(100)]);

      const treasuryAfter = await usdc.read.balanceOf([
        treasuryWallet.account.address,
      ]);

      // Treasury gets 30% = 30 USDC
      expect(treasuryAfter - treasuryBefore).to.equal(parseUSDC(30));

      // Staker (sole) gets 50% = 50 USDC
      const earned = await revenueShare.read.earned([alice.account.address]);
      expect(earned).to.equal(parseUSDC(50));

      // Burn: 20% = 20 USDC → dead address
      expect(await revenueShare.read.totalBurned()).to.equal(parseUSDC(20));
    });

    it("should send burn allocation to dead address", async function () {
      const { usdc, revenueShare, hireAsAlice, rsAsAlice } =
        await deployFixture();
      await hireAsAlice.write.approve([
        revenueShare.address,
        parseHIRE(1_000_000),
      ]);
      await rsAsAlice.write.stake([parseHIRE(1_000_000)]);

      const deadAddr = "0x000000000000000000000000000000000000dEaD";
      const deadBefore = await usdc.read.balanceOf([deadAddr]);

      await usdc.write.transfer([revenueShare.address, parseUSDC(100)]);
      await revenueShare.write.distributeRevenue([parseUSDC(100)]);

      const deadAfter = await usdc.read.balanceOf([deadAddr]);
      expect(deadAfter - deadBefore).to.equal(parseUSDC(20));
    });

    it("should distribute proportionally with multiple stakers", async function () {
      const {
        usdc,
        revenueShare,
        hireAsAlice,
        hireAsBob,
        rsAsAlice,
        rsAsBob,
        alice,
        bob,
      } = await deployFixture();

      // Alice stakes 2M, Bob stakes 1M (2:1 ratio)
      await hireAsAlice.write.approve([
        revenueShare.address,
        parseHIRE(2_000_000),
      ]);
      await rsAsAlice.write.stake([parseHIRE(2_000_000)]);
      await hireAsBob.write.approve([
        revenueShare.address,
        parseHIRE(1_000_000),
      ]);
      await rsAsBob.write.stake([parseHIRE(1_000_000)]);

      await usdc.write.transfer([revenueShare.address, parseUSDC(100)]);
      await revenueShare.write.distributeRevenue([parseUSDC(100)]);

      // 50% = 50 USDC to stakers
      // Alice: 2/3 * 50 = 33.333... Bob: 1/3 * 50 = 16.666...
      const aliceEarned = Number(
        formatUnits(
          await revenueShare.read.earned([alice.account.address]),
          6
        )
      );
      const bobEarned = Number(
        formatUnits(
          await revenueShare.read.earned([bob.account.address]),
          6
        )
      );

      expect(aliceEarned + bobEarned).to.be.closeTo(50, 1);
      expect(aliceEarned).to.be.closeTo(33.33, 1);
      expect(bobEarned).to.be.closeTo(16.67, 1);
    });

    it("should send all to treasury if no stakers", async function () {
      const { usdc, revenueShare, treasuryWallet } = await deployFixture();
      const before = await usdc.read.balanceOf([
        treasuryWallet.account.address,
      ]);

      await usdc.write.transfer([revenueShare.address, parseUSDC(100)]);
      await revenueShare.write.distributeRevenue([parseUSDC(100)]);

      const after = await usdc.read.balanceOf([
        treasuryWallet.account.address,
      ]);

      // Treasury: 30 USDC (normal share) + 50 USDC (staker share redirected) = 80
      // Burn: 20 USDC still goes to dead address
      expect(after - before).to.equal(parseUSDC(80));
      expect(await revenueShare.read.totalBurned()).to.equal(parseUSDC(20));
    });
  });

  describe("Claiming Rewards", function () {
    it("should transfer USDC on claim", async function () {
      const { usdc, revenueShare, hireAsAlice, rsAsAlice, alice } =
        await deployFixture();
      await hireAsAlice.write.approve([
        revenueShare.address,
        parseHIRE(1_000_000),
      ]);
      await rsAsAlice.write.stake([parseHIRE(1_000_000)]);

      await usdc.write.transfer([revenueShare.address, parseUSDC(100)]);
      await revenueShare.write.distributeRevenue([parseUSDC(100)]);

      const before = await usdc.read.balanceOf([alice.account.address]);
      await rsAsAlice.write.claimRewards();
      const after = await usdc.read.balanceOf([alice.account.address]);

      // 50% of 100 = 50 USDC
      expect(after - before).to.equal(parseUSDC(50));
    });

    it("should reject claim with no rewards", async function () {
      const { rsAsAlice } = await deployFixture();
      await expectRevert(rsAsAlice.write.claimRewards(), "NoRewards");
    });
  });

  describe("Admin: setBurnBps", function () {
    it("should allow owner to set burn bps", async function () {
      const { revenueShare } = await deployFixture();
      await revenueShare.write.setBurnBps([3000n]);
      expect(await revenueShare.read.burnBps()).to.equal(3000n);
    });

    it("should reject burn bps over max (50%)", async function () {
      const { revenueShare } = await deployFixture();
      await expectRevert(
        revenueShare.write.setBurnBps([5001n]),
        "BurnBpsTooHigh"
      );
    });

    it("should reject if treasury + burn > 100%", async function () {
      const { revenueShare } = await deployFixture();
      // First set treasury high
      await revenueShare.write.setTreasuryBps([8000n]);
      // Now try to set burn to 2001 → 8000 + 2001 = 10001 > 10000
      await expectRevert(
        revenueShare.write.setBurnBps([2001n]),
        "InvalidBps"
      );
    });

    it("should allow pause and unpause", async function () {
      const { revenueShare, hireAsAlice, rsAsAlice, alice } =
        await deployFixture();
      await revenueShare.write.pause();
      await hireAsAlice.write.approve([
        revenueShare.address,
        parseHIRE(1_000_000),
      ]);
      await expectRevert(rsAsAlice.write.stake([parseHIRE(1_000_000)]));

      await revenueShare.write.unpause();
      await rsAsAlice.write.stake([parseHIRE(1_000_000)]);
      expect(
        await revenueShare.read.staked([alice.account.address])
      ).to.equal(parseHIRE(1_000_000));
    });
  });

  describe("Stats", function () {
    it("should track total burned correctly", async function () {
      const { usdc, revenueShare, hireAsAlice, rsAsAlice } =
        await deployFixture();
      await hireAsAlice.write.approve([
        revenueShare.address,
        parseHIRE(1_000_000),
      ]);
      await rsAsAlice.write.stake([parseHIRE(1_000_000)]);

      await usdc.write.transfer([revenueShare.address, parseUSDC(100)]);
      await revenueShare.write.distributeRevenue([parseUSDC(100)]);
      await usdc.write.transfer([revenueShare.address, parseUSDC(200)]);
      await revenueShare.write.distributeRevenue([parseUSDC(200)]);

      // 20% of 300 = 60 USDC burned
      expect(await revenueShare.read.totalBurned()).to.equal(parseUSDC(60));
    });

    it("should return correct stats", async function () {
      const { usdc, revenueShare, hireAsAlice, rsAsAlice } =
        await deployFixture();
      await hireAsAlice.write.approve([
        revenueShare.address,
        parseHIRE(1_000_000),
      ]);
      await rsAsAlice.write.stake([parseHIRE(1_000_000)]);

      await usdc.write.transfer([revenueShare.address, parseUSDC(100)]);
      await revenueShare.write.distributeRevenue([parseUSDC(100)]);

      const stats = await revenueShare.read.getStats();
      expect(stats[0]).to.equal(parseHIRE(1_000_000)); // totalStaked
      expect(stats[1]).to.equal(parseUSDC(50));          // totalDistributed
      expect(stats[2]).to.equal(parseUSDC(30));          // totalToTreasury
      expect(stats[3]).to.equal(parseUSDC(20));          // totalBurned
      expect(stats[4]).to.equal(3000n);                  // treasuryBps
      expect(stats[5]).to.equal(2000n);                  // burnBps
    });
  });
});
