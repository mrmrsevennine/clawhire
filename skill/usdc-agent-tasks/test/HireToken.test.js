import { expect } from "chai";
import hre from "hardhat";
import { parseUnits, formatUnits } from "viem";
import { describe, it } from "node:test";

describe("HireToken", function () {
  const parseHIRE = (n) => parseUnits(String(n), 18);
  const parseUSDC = (n) => parseUnits(String(n), 6);

  async function deployFixture() {
    const nc = await hre.network.connect();
    const [owner, treasury, team, worker, poster, minter] =
      await nc.viem.getWalletClients();
    const publicClient = await nc.viem.getPublicClient();

    const hire = await nc.viem.deployContract("HireToken", [
      treasury.account.address,
      team.account.address,
    ]);

    // Set minter role
    await hire.write.setMinter([minter.account.address]);

    const hireAsMinter = await nc.viem.getContractAt(
      "HireToken",
      hire.address,
      { client: { wallet: minter } }
    );

    const hireAsWorker = await nc.viem.getContractAt(
      "HireToken",
      hire.address,
      { client: { wallet: worker } }
    );

    return {
      hire,
      hireAsMinter,
      hireAsWorker,
      publicClient,
      owner,
      treasury,
      team,
      worker,
      poster,
      minter,
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

  describe("Constructor & Initial Allocations", function () {
    it("should have correct name and symbol", async function () {
      const { hire } = await deployFixture();
      expect(await hire.read.name()).to.equal("hire");
      expect(await hire.read.symbol()).to.equal("HIRE");
    });

    it("should mint 50M to treasury (25M treasury + 10M community + 15M staking)", async function () {
      const { hire, treasury } = await deployFixture();
      const balance = await hire.read.balanceOf([treasury.account.address]);
      expect(balance).to.equal(parseHIRE(50_000_000));
    });

    it("should mint 10M to team", async function () {
      const { hire, team } = await deployFixture();
      const balance = await hire.read.balanceOf([team.account.address]);
      expect(balance).to.equal(parseHIRE(10_000_000));
    });

    it("should have 60M total supply at launch (40M unminted for mining)", async function () {
      const { hire } = await deployFixture();
      expect(await hire.read.totalSupply()).to.equal(parseHIRE(60_000_000));
    });

    it("should have MAX_SUPPLY of 100M", async function () {
      const { hire } = await deployFixture();
      expect(await hire.read.MAX_SUPPLY()).to.equal(parseHIRE(100_000_000));
    });

    it("should have MINING_POOL of 40M", async function () {
      const { hire } = await deployFixture();
      expect(await hire.read.MINING_POOL()).to.equal(parseHIRE(40_000_000));
    });

    it("should have totalMined starting at 0", async function () {
      const { hire } = await deployFixture();
      expect(await hire.read.totalMined()).to.equal(0n);
    });
  });

  describe("Minter Role", function () {
    it("should allow owner to set minter", async function () {
      const { hire, minter } = await deployFixture();
      expect(
        (await hire.read.minter()).toLowerCase()
      ).to.equal(minter.account.address.toLowerCase());
    });

    it("should revert if non-owner tries to set minter", async function () {
      const { hireAsWorker, worker } = await deployFixture();
      await expectRevert(
        hireAsWorker.write.setMinter([worker.account.address]),
        "OwnableUnauthorizedAccount"
      );
    });

    it("should revert if setting minter to zero address", async function () {
      const { hire } = await deployFixture();
      await expectRevert(
        hire.write.setMinter(["0x0000000000000000000000000000000000000000"]),
        "InvalidAddress"
      );
    });
  });

  describe("Mining Rate & Epoch", function () {
    it("should return epoch 0 at deployment", async function () {
      const { hire } = await deployFixture();
      expect(await hire.read.currentEpoch()).to.equal(0n);
    });

    it("should return initial mining rate of 10", async function () {
      const { hire } = await deployFixture();
      expect(await hire.read.miningRate()).to.equal(10n);
    });
  });

  describe("Work Mining (mintForWork)", function () {
    it("should mint correct amounts: 80% worker, 20% poster", async function () {
      const { hire, hireAsMinter, worker, poster } = await deployFixture();
      const taskValue = parseUSDC(100); // 100 USDC

      await hireAsMinter.write.mintForWork([
        worker.account.address,
        poster.account.address,
        taskValue,
      ]);

      // 100 USDC * 10 rate = 1000 HIRE total
      // Worker: 800 HIRE, Poster: 200 HIRE
      const workerBalance = await hire.read.balanceOf([
        worker.account.address,
      ]);
      const posterBalance = await hire.read.balanceOf([
        poster.account.address,
      ]);

      expect(workerBalance).to.equal(parseHIRE(800));
      expect(posterBalance).to.equal(parseHIRE(200));
    });

    it("should update totalMined correctly", async function () {
      const { hire, hireAsMinter, worker, poster } = await deployFixture();
      const taskValue = parseUSDC(50); // 50 USDC

      await hireAsMinter.write.mintForWork([
        worker.account.address,
        poster.account.address,
        taskValue,
      ]);

      // 50 USDC * 10 = 500 HIRE
      expect(await hire.read.totalMined()).to.equal(parseHIRE(500));
    });

    it("should revert if non-minter calls mintForWork", async function () {
      const { hireAsWorker, worker, poster } = await deployFixture();
      await expectRevert(
        hireAsWorker.write.mintForWork([
          worker.account.address,
          poster.account.address,
          parseUSDC(100),
        ]),
        "OnlyMinter"
      );
    });

    it("should revert if mining pool would be exceeded", async function () {
      const { hireAsMinter, worker, poster } = await deployFixture();

      // Try to mint more than MINING_POOL in one go
      // 40M HIRE / 10 rate = 4M USDC max per epoch
      // 4,000,001 USDC * 10 = 40,000,010 > 40M pool
      const hugeTask = parseUSDC(4_000_001);
      await expectRevert(
        hireAsMinter.write.mintForWork([
          worker.account.address,
          poster.account.address,
          hugeTask,
        ]),
        "MiningPoolExhausted"
      );
    });

    it("should allow mining up to the pool limit", async function () {
      const { hire, hireAsMinter, worker, poster } = await deployFixture();

      // Exactly 4M USDC * 10 rate = 40M HIRE = full pool
      const maxTask = parseUSDC(4_000_000);
      await hireAsMinter.write.mintForWork([
        worker.account.address,
        poster.account.address,
        maxTask,
      ]);

      expect(await hire.read.totalMined()).to.equal(parseHIRE(40_000_000));

      // Next mint should fail
      await expectRevert(
        hireAsMinter.write.mintForWork([
          worker.account.address,
          poster.account.address,
          parseUSDC(1),
        ]),
        "MiningPoolExhausted"
      );
    });

    it("should increase total supply when mining", async function () {
      const { hire, hireAsMinter, worker, poster } = await deployFixture();

      const supplyBefore = await hire.read.totalSupply();
      await hireAsMinter.write.mintForWork([
        worker.account.address,
        poster.account.address,
        parseUSDC(100),
      ]);
      const supplyAfter = await hire.read.totalSupply();

      expect(supplyAfter - supplyBefore).to.equal(parseHIRE(1000));
    });
  });

  describe("Burn", function () {
    it("should allow anyone to burn their own tokens", async function () {
      const { hire, treasury } = await deployFixture();

      const hireAsTreasury = await (
        await hre.network.connect()
      ).viem.getContractAt("HireToken", hire.address, {
        client: { wallet: treasury },
      });

      const balanceBefore = await hire.read.balanceOf([
        treasury.account.address,
      ]);
      const burnAmount = parseHIRE(1_000_000);

      await hireAsTreasury.write.burn([burnAmount]);

      const balanceAfter = await hire.read.balanceOf([
        treasury.account.address,
      ]);
      expect(balanceBefore - balanceAfter).to.equal(burnAmount);
    });

    it("should reduce total supply on burn", async function () {
      const { hire, treasury } = await deployFixture();

      const hireAsTreasury = await (
        await hre.network.connect()
      ).viem.getContractAt("HireToken", hire.address, {
        client: { wallet: treasury },
      });

      const supplyBefore = await hire.read.totalSupply();
      await hireAsTreasury.write.burn([parseHIRE(1_000_000)]);
      const supplyAfter = await hire.read.totalSupply();

      expect(supplyBefore - supplyAfter).to.equal(parseHIRE(1_000_000));
    });
  });
});
