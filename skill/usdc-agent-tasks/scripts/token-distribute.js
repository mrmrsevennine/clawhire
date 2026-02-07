#!/usr/bin/env node
// Distribute accumulated USDC fees to stakers + treasury
import { ethers } from 'ethers';
import { config } from '../lib/config.js';

const RS_ABI = [
  'function distributeAll() external',
  'function distributeRevenue(uint256 amount) external',
  'function getStats() view returns (uint256,uint256,uint256,uint256,uint256)',
];
const ERC20_ABI = ['function balanceOf(address) view returns (uint256)'];

const provider = new ethers.JsonRpcProvider(config.rpcUrl);
const wallet = new ethers.Wallet(config.privateKey, provider);
const rs = new ethers.Contract(config.REVENUE_SHARE, RS_ABI, wallet);
const usdc = new ethers.Contract(config.usdcAddress, ERC20_ABI, provider);

const balance = await usdc.balanceOf(config.REVENUE_SHARE);
console.log(`USDC in RevenueShare: ${ethers.formatUnits(balance, 6)}`);

if (balance === 0n) {
  console.log('No USDC to distribute. Fees arrive when tasks are approved.');
  process.exit(0);
}

console.log(`Distributing ${ethers.formatUnits(balance, 6)} USDC...`);
const tx = await rs.distributeRevenue(balance);
const receipt = await tx.wait();
console.log(`✅ Distributed! TX: ${receipt.hash}`);

const [totalStaked, totalDistributed, totalToTreasury, treasuryBps] = await rs.getStats();
console.log(`\nStaker pool received: ${ethers.formatUnits(totalDistributed, 6)} USDC`);
console.log(`Treasury received: ${ethers.formatUnits(totalToTreasury, 6)} USDC`);
