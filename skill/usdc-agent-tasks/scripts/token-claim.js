#!/usr/bin/env node
// Claim USDC rewards from staking $HIRE
import { ethers } from 'ethers';
import { config } from '../lib/config.js';

const REVENUE_SHARE_ABI = [
  'function claimRewards() external',
  'function earned(address) view returns (uint256)',
  'function staked(address) view returns (uint256)',
  'function getStakeInfo(address) view returns (uint256,uint256,uint256)',
];

const provider = new ethers.JsonRpcProvider(config.rpcUrl);
const wallet = new ethers.Wallet(config.privateKey, provider);
const rs = new ethers.Contract(config.REVENUE_SHARE, REVENUE_SHARE_ABI, wallet);

const [stakedAmt, pending, sharePercent] = await rs.getStakeInfo(wallet.address);
console.log(`Wallet: ${wallet.address}`);
console.log(`Staked: ${ethers.formatEther(stakedAmt)} $HIRE`);
console.log(`Pool share: ${(Number(sharePercent) / 100).toFixed(2)}%`);
console.log(`Pending USDC: ${ethers.formatUnits(pending, 6)}`);

if (pending === 0n) {
  console.log('No rewards to claim.');
  process.exit(0);
}

console.log(`\nClaiming ${ethers.formatUnits(pending, 6)} USDC...`);
const tx = await rs.claimRewards();
const receipt = await tx.wait();
console.log(`✅ Claimed! TX: ${receipt.hash}`);
