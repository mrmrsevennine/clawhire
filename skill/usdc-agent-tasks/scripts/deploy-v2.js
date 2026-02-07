/**
 * clawhire V2 — Full Deployment Script
 *
 * Deploys all V2 contracts and wires them together:
 * 1. HireToken (with treasury + team allocations)
 * 2. RevenueShareV2 (staking + burn mechanism)
 * 3. TaskEscrowV2 (escrow + flash tasks + stake-to-work)
 * 4. DeadManSwitch (90-day heartbeat trust mechanism)
 *
 * Usage:
 *   npx hardhat run scripts/deploy-v2.js --network base-sepolia
 *   npx hardhat run scripts/deploy-v2.js --network hardhat
 */

import hre from "hardhat";
import fs from "fs";

// Network-specific USDC addresses
const USDC_ADDRESSES = {
  "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  "polygon-amoy": "0x0FA8781a83E46826621b3BC094Ea2A0212e71B23",
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base Mainnet USDC
};

async function main() {
  const networkName = hre.network.name || "hardhat";
  console.log(`\n🚀 Deploying clawhire V2 to ${networkName}...\n`);

  const nc = await hre.network.connect();
  const [deployer] = await nc.viem.getWalletClients();
  const publicClient = await nc.viem.getPublicClient();

  console.log(`Deployer: ${deployer.account.address}`);

  // For local testing, deploy a mock USDC
  let usdcAddress;
  if (networkName === "hardhat" || networkName === "localhost") {
    console.log("Deploying Mock USDC for local testing...");
    const usdc = await nc.viem.deployContract("MockERC20", [
      "USD Coin",
      "USDC",
      6,
    ]);
    usdcAddress = usdc.address;
    console.log(`  Mock USDC: ${usdcAddress}`);
  } else {
    usdcAddress = USDC_ADDRESSES[networkName];
    if (!usdcAddress) {
      throw new Error(`No USDC address configured for network: ${networkName}`);
    }
  }

  // Treasury and team addresses (deployer is both for now)
  const treasuryAddress = deployer.account.address;
  const teamAddress = deployer.account.address;

  // 1. Deploy HireToken
  console.log("\n1️⃣  Deploying HireToken...");
  const hire = await nc.viem.deployContract("HireToken", [
    treasuryAddress,
    teamAddress,
  ]);
  console.log(`   HireToken: ${hire.address}`);

  // 2. Deploy RevenueShareV2
  console.log("2️⃣  Deploying RevenueShareV2...");
  const revenueShare = await nc.viem.deployContract("RevenueShareV2", [
    hire.address,
    usdcAddress,
    treasuryAddress,
  ]);
  console.log(`   RevenueShareV2: ${revenueShare.address}`);

  // 3. Deploy TaskEscrowV2 (fee recipient = RevenueShareV2)
  console.log("3️⃣  Deploying TaskEscrowV2...");
  const escrow = await nc.viem.deployContract("TaskEscrowV2", [
    usdcAddress,
    revenueShare.address,
  ]);
  console.log(`   TaskEscrowV2: ${escrow.address}`);

  // 4. Deploy DeadManSwitch
  console.log("4️⃣  Deploying DeadManSwitch...");
  const dms = await nc.viem.deployContract("DeadManSwitch", [
    hire.address,
    usdcAddress,
  ]);
  console.log(`   DeadManSwitch: ${dms.address}`);

  // 5. Wire contracts together
  console.log("\n🔗 Wiring contracts...");

  // Set HireToken on TaskEscrowV2
  await escrow.write.setHireToken([hire.address]);
  console.log("   ✅ TaskEscrowV2.setHireToken → HireToken");

  // Set TaskEscrowV2 as minter on HireToken
  await hire.write.setMinter([escrow.address]);
  console.log("   ✅ HireToken.setMinter → TaskEscrowV2");

  console.log("\n✨ Deployment complete!\n");

  // Save deployment info
  const deployment = {
    network: networkName,
    chainId: await publicClient.getChainId(),
    contracts: {
      hireToken: hire.address,
      taskEscrowV2: escrow.address,
      revenueShareV2: revenueShare.address,
      deadManSwitch: dms.address,
      usdc: usdcAddress,
    },
    wiring: {
      escrowFeeRecipient: revenueShare.address,
      escrowHireToken: hire.address,
      hireTokenMinter: escrow.address,
    },
    deployer: deployer.account.address,
    treasury: treasuryAddress,
    team: teamAddress,
    deployedAt: new Date().toISOString(),
    version: "2.0.0",
  };

  const filename = `deployment-v2${networkName !== "hardhat" ? `-${networkName}` : ""}.json`;
  fs.writeFileSync(filename, JSON.stringify(deployment, null, 2));
  console.log(`📄 Deployment saved to ${filename}`);

  console.log("\n--- Contract Addresses ---");
  console.log(`HireToken:       ${hire.address}`);
  console.log(`TaskEscrowV2:    ${escrow.address}`);
  console.log(`RevenueShareV2:  ${revenueShare.address}`);
  console.log(`DeadManSwitch:   ${dms.address}`);
  console.log(`USDC:            ${usdcAddress}`);
}

main().catch(console.error);
