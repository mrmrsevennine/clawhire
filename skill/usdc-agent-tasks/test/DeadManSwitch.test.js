import { expect } from "chai";
import hre from "hardhat";
import { parseUnits } from "viem";
import { describe, it } from "node:test";

describe("DeadManSwitch", function () {
  const parseUSDC = (n) => parseUnits(String(n), 6);
  const parseHIRE = (n) => parseUnits(String(n), 18);

  const NINETY_DAYS = 90 * 24 * 60 * 60; // 7,776,000 seconds

  async function deployFixture() {
    const nc = await hre.network.connect();
    const [owner, alice, bob, treasury, team] =
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

    // Deploy DeadManSwitch
    const dms = await nc.viem.deployContract("DeadManSwitch", [
      hire.address,
      usdc.address,
    ]);

    // Transfer HIRE to alice and bob
    const hireAsTreasury = await nc.viem.getContractAt(
      "HireToken",
      hire.address,
      { client: { wallet: treasury } }
    );
    await hireAsTreasury.write.transfer([
      alice.account.address,
      parseHIRE(10_000_000),
    ]);
    await hireAsTreasury.write.transfer([
      bob.account.address,
      parseHIRE(5_000_000),
    ]);

    // Deposit USDC and HIRE into DMS
    await usdc.write.mint([dms.address, parseUSDC(10_000)]);
    await hireAsTreasury.write.transfer([dms.address, parseHIRE(1_000_000)]);

    // Get contract instances
    const dmsAsAlice = await nc.viem.getContractAt(
      "DeadManSwitch",
      dms.address,
      { client: { wallet: alice } }
    );
    const dmsAsBob = await nc.viem.getContractAt(
      "DeadManSwitch",
      dms.address,
      { client: { wallet: bob } }
    );

    return {
      usdc,
      hire,
      dms,
      dmsAsAlice,
      dmsAsBob,
      publicClient,
      owner,
      alice,
      bob,
      treasury,
      team,
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

  // Helper to advance time
  async function advanceTime(publicClient, seconds) {
    await publicClient.request({
      method: "evm_increaseTime",
      params: [seconds],
    });
    await publicClient.request({
      method: "evm_mine",
      params: [],
    });
  }

  describe("Constructor", function () {
    it("should set owner and initial heartbeat", async function () {
      const { dms, owner } = await deployFixture();
      expect((await dms.read.owner()).toLowerCase()).to.equal(
        owner.account.address.toLowerCase()
      );
      const heartbeat = await dms.read.lastHeartbeat();
      expect(heartbeat > 0n).to.equal(true);
    });
  });

  describe("Heartbeat", function () {
    it("should update lastHeartbeat timestamp", async function () {
      const { dms, publicClient } = await deployFixture();
      const before = await dms.read.lastHeartbeat();
      await advanceTime(publicClient, 1000);
      await dms.write.heartbeat();
      const after = await dms.read.lastHeartbeat();
      expect(after > before).to.equal(true);
    });

    it("should only allow owner to heartbeat", async function () {
      const { dmsAsAlice } = await deployFixture();
      await expectRevert(dmsAsAlice.write.heartbeat(), "OnlyOwner");
    });
  });

  describe("isAbandoned", function () {
    it("should return false before 90 days", async function () {
      const { dms, publicClient } = await deployFixture();
      // Advance 89 days
      await advanceTime(publicClient, NINETY_DAYS - 86400);
      expect(await dms.read.isAbandoned()).to.equal(false);
    });

    it("should return true after 90 days", async function () {
      const { dms, publicClient } = await deployFixture();
      await advanceTime(publicClient, NINETY_DAYS + 1);
      expect(await dms.read.isAbandoned()).to.equal(true);
    });

    it("should reset on heartbeat", async function () {
      const { dms, publicClient } = await deployFixture();
      // Advance 80 days
      await advanceTime(publicClient, 80 * 86400);
      expect(await dms.read.isAbandoned()).to.equal(false);

      // Heartbeat resets timer
      await dms.write.heartbeat();
      await advanceTime(publicClient, 80 * 86400);
      expect(await dms.read.isAbandoned()).to.equal(false);
    });
  });

  describe("Emergency Distribution", function () {
    it("should revert if not abandoned", async function () {
      const { dmsAsAlice } = await deployFixture();
      await expectRevert(
        dmsAsAlice.write.emergencyDistribute(),
        "NotAbandoned"
      );
    });

    it("should trigger emergency distribution after 90 days", async function () {
      const { dms, dmsAsAlice, publicClient, usdc, hire } =
        await deployFixture();
      await advanceTime(publicClient, NINETY_DAYS + 1);

      await dmsAsAlice.write.emergencyDistribute();

      expect(await dms.read.emergencyTriggered()).to.equal(true);
      const usdcSnapshot = await dms.read.snapshotUsdcBalance();
      const hireSnapshot = await dms.read.snapshotHireBalance();
      expect(usdcSnapshot).to.equal(parseUSDC(10_000));
      expect(hireSnapshot).to.equal(parseHIRE(1_000_000));
    });

    it("should not allow double emergency trigger", async function () {
      const { dmsAsAlice, publicClient } = await deployFixture();
      await advanceTime(publicClient, NINETY_DAYS + 1);
      await dmsAsAlice.write.emergencyDistribute();

      await expectRevert(
        dmsAsAlice.write.emergencyDistribute(),
        "AlreadyAbandoned"
      );
    });
  });

  describe("Emergency Claims", function () {
    it("should allow HIRE holders to claim pro-rata", async function () {
      const { dms, dmsAsAlice, usdc, hire, alice, publicClient } =
        await deployFixture();
      await advanceTime(publicClient, NINETY_DAYS + 1);
      await dmsAsAlice.write.emergencyDistribute();

      const usdcBefore = await usdc.read.balanceOf([alice.account.address]);
      const hireBefore = await hire.read.balanceOf([alice.account.address]);

      await dmsAsAlice.write.claimEmergency();

      const usdcAfter = await usdc.read.balanceOf([alice.account.address]);
      const hireAfter = await hire.read.balanceOf([alice.account.address]);

      // Alice has 10M HIRE out of 60M total supply
      // USDC share: 10M / 60M * 10000 = 1666.666... USDC
      // HIRE share: 10M / 60M * 1M = 166666.666... HIRE
      const usdcClaimed = usdcAfter - usdcBefore;
      const hireClaimed = hireAfter - hireBefore;

      expect(usdcClaimed > 0n).to.equal(true);
      expect(hireClaimed > 0n).to.equal(true);
    });

    it("should prevent double claims", async function () {
      const { dmsAsAlice, publicClient } = await deployFixture();
      await advanceTime(publicClient, NINETY_DAYS + 1);
      await dmsAsAlice.write.emergencyDistribute();
      await dmsAsAlice.write.claimEmergency();

      await expectRevert(dmsAsAlice.write.claimEmergency(), "AlreadyClaimed");
    });

    it("should revert claim before emergency is triggered", async function () {
      const { dmsAsAlice } = await deployFixture();
      await expectRevert(
        dmsAsAlice.write.claimEmergency(),
        "EmergencyNotTriggered"
      );
    });
  });

  describe("Owner Recovery", function () {
    it("should allow owner to recover tokens before abandonment", async function () {
      const { dms, usdc, owner } = await deployFixture();
      const before = await usdc.read.balanceOf([owner.account.address]);
      await dms.write.recoverTokens([usdc.address, parseUSDC(100)]);
      const after = await usdc.read.balanceOf([owner.account.address]);
      expect(after - before).to.equal(parseUSDC(100));
    });

    it("should not allow recovery after abandonment", async function () {
      const { dms, usdc, publicClient } = await deployFixture();
      await advanceTime(publicClient, NINETY_DAYS + 1);

      await expectRevert(
        dms.write.recoverTokens([usdc.address, parseUSDC(100)]),
        "AlreadyAbandoned"
      );
    });

    it("should not allow non-owner to recover", async function () {
      const { dmsAsAlice, usdc } = await deployFixture();
      await expectRevert(
        dmsAsAlice.write.recoverTokens([usdc.address, parseUSDC(100)]),
        "OnlyOwner"
      );
    });
  });
});
