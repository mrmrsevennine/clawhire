#!/usr/bin/env node
// Unstake $HIRE tokens from RevenueShare contract
import { ethers } from 'ethers';
import { config } from '../lib/config.js';

const REVENUE_SHARE_ABI = [
  'function unstake(uint256 amount) external',
  'function staked(address) view returns (uint256)',
  'function earned(address) view returns (uint256)',
];

const amount = process.argv[2];
if (!amount) {
  console.error('Usage: node token-unstake.js <amount>');
  console.error('  amount: number of $HIRE tokens to unstake (e.g. 1000)');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(config.rpcUrl);
const wallet = new ethers.Wallet(config.privateKey, provider);
const rs = new ethers.Contract(config.REVENUE_SHARE, REVENUE_SHARE_ABI, wallet);
const amountWei = ethers.parseEther(amount);

const staked = await rs.staked(wallet.address);
console.log(`Current stake: ${ethers.formatEther(staked)} $HIRE`);

if (staked < amountWei) {
  console.error(`Insufficient stake. Have ${ethers.formatEther(staked)}, want to unstake ${amount}`);
  process.exit(1);
}

console.log(`Unstaking ${amount} $HIRE...`);
const tx = await rs.unstake(amountWei);
const receipt = await tx.wait();
console.log(`✅ Unstaked! TX: ${receipt.hash}`);

const remaining = await rs.staked(wallet.address);
const pending = await rs.earned(wallet.address);
console.log(`Remaining stake: ${ethers.formatEther(remaining)} $HIRE`);
console.log(`Pending rewards: ${ethers.formatUnits(pending, 6)} USDC`);
