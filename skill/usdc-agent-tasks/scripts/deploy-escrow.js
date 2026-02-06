#!/usr/bin/env node
/**
 * Deploy TaskEscrow to Polygon Amoy testnet
 *
 * Usage:
 *   node scripts/deploy-escrow.js [--network amoy]
 *
 * Environment:
 *   PRIVATE_KEY - Deployer wallet private key
 *   RPC_URL     - RPC endpoint (default: https://rpc-amoy.polygon.technology)
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Network configurations
const NETWORKS = {
  'base-sepolia': {
    rpcUrl: 'https://sepolia.base.org',
    chainId: 84532,
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    explorer: 'https://sepolia.basescan.org',
    gasToken: 'ETH',
  },
  'polygon-amoy': {
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    chainId: 80002,
    usdcAddress: '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23',
    explorer: 'https://amoy.polygonscan.com',
    gasToken: 'POL',
  },
};

// Select network from env or CLI arg (default: base-sepolia)
const networkName = process.env.DEPLOY_NETWORK || process.argv.find(a => a.startsWith('--network='))?.split('=')[1] || 'base-sepolia';
const NETWORK = NETWORKS[networkName];
if (!NETWORK) {
  console.error(`❌ Unknown network: ${networkName}. Available: ${Object.keys(NETWORKS).join(', ')}`);
  process.exit(1);
}

const CONFIG = {
  rpcUrl: process.env.RPC_URL || NETWORK.rpcUrl,
  chainId: NETWORK.chainId,
  usdcAddress: NETWORK.usdcAddress,
  feeRecipient: process.env.FEE_RECIPIENT || null,
};

async function main() {
  console.log('🚀 TaskEscrow Deployment Script');
  console.log('================================\n');

  // Check for private key
  if (!process.env.PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY environment variable is required');
    console.log('\nUsage:');
    console.log('  PRIVATE_KEY=0x... node scripts/deploy-escrow.js');
    process.exit(1);
  }

  // Connect to network
  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log(`📡 Network: ${networkName} (${CONFIG.rpcUrl})`);
  console.log('👛 Deployer:', wallet.address);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), NETWORK.gasToken, '\n');

  if (balance === 0n) {
    console.error('❌ Error: Deployer wallet has no POL for gas');
    console.log('Get testnet POL from: https://faucet.polygon.technology/');
    process.exit(1);
  }

  // Read compiled contract artifact
  const artifactPath = path.join(__dirname, '../artifacts/contracts/TaskEscrow.sol/TaskEscrow.json');

  if (!fs.existsSync(artifactPath)) {
    console.error('❌ Error: Contract not compiled. Run: npx hardhat compile');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  // Fee recipient defaults to deployer
  const feeRecipient = CONFIG.feeRecipient || wallet.address;

  console.log('📋 Contract Parameters:');
  console.log('  USDC Address:', CONFIG.usdcAddress);
  console.log('  Fee Recipient:', feeRecipient);
  console.log('  Platform Fee: 2.5%\n');

  // Deploy contract
  console.log('📦 Deploying TaskEscrow...\n');

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  try {
    // Gas settings: use network defaults (Base Sepolia is cheap)
    const deployOpts = {};
    if (networkName === 'polygon-amoy') {
      // Amoy needs explicit gas price (minimum 25 gwei)
      deployOpts.maxFeePerGas = ethers.parseUnits('30', 'gwei');
      deployOpts.maxPriorityFeePerGas = ethers.parseUnits('25', 'gwei');
    }

    const contract = await factory.deploy(CONFIG.usdcAddress, feeRecipient, deployOpts);
    console.log('⏳ Transaction sent:', contract.deploymentTransaction().hash);
    console.log('   Waiting for confirmation...\n');

    await contract.waitForDeployment();
    const address = await contract.getAddress();

    console.log('✅ TaskEscrow deployed successfully!');
    console.log('📍 Contract Address:', address);
    console.log(`\n🔗 View on ${networkName === 'base-sepolia' ? 'BaseScan' : 'PolygonScan'}:`);
    console.log(`   ${NETWORK.explorer}/address/${address}`);

    // Save deployment info
    const deploymentInfo = {
      network: networkName,
      chainId: CONFIG.chainId,
      escrowAddress: address,
      usdcAddress: CONFIG.usdcAddress,
      feeRecipient: feeRecipient,
      deployer: wallet.address,
      deployedAt: new Date().toISOString(),
      transactionHash: contract.deploymentTransaction().hash,
    };

    const deploymentPath = path.join(__dirname, `../contracts/deployment-${networkName}.json`);
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to contracts/deployment-${networkName}.json`);

    // Also save as default deployment.json
    const defaultPath = path.join(__dirname, '../contracts/deployment.json');
    fs.writeFileSync(defaultPath, JSON.stringify(deploymentInfo, null, 2));

    console.log(`\n🔗 View on Explorer:`);
    console.log(`   ${NETWORK.explorer}/address/${address}`);

    // Update config for CLI scripts
    console.log('\n📝 To use with CLI scripts, set:');
    console.log(`   export ESCROW_ADDRESS=${address}`);

    return address;
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    if (error.data) {
      console.error('   Data:', error.data);
    }
    process.exit(1);
  }
}

main().catch(console.error);
