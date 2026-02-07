#!/usr/bin/env node
// Show $HIRE token and staking stats
import { ethers } from 'ethers';
import { config } from '../lib/config.js';

const REVENUE_SHARE_ABI = [
  'function getStats() view returns (uint256,uint256,uint256,uint256,uint256)',
  'function staked(address) view returns (uint256)',
  'function earned(address) view returns (uint256)',
];
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
];

const provider = new ethers.JsonRpcProvider(config.rpcUrl);
const token = new ethers.Contract(config.HIRE_TOKEN, ERC20_ABI, provider);
const rs = new ethers.Contract(config.REVENUE_SHARE, REVENUE_SHARE_ABI, provider);

const [name, symbol, supply] = await Promise.all([
  token.name(), token.symbol(), token.totalSupply(),
]);
const [totalStaked, totalDistributed, totalToTreasury, treasuryBps] = await rs.getStats();

console.log(`\n═══ $${symbol} Token Stats ═══`);
console.log(`Name: ${name}`);
console.log(`Symbol: ${symbol}`);
console.log(`Total Supply: ${ethers.formatEther(supply)}`);
console.log(`Token: ${config.HIRE_TOKEN}`);

console.log(`\n═══ Staking Stats ═══`);
console.log(`Total Staked: ${ethers.formatEther(totalStaked)} $${symbol}`);
console.log(`USDC Distributed to Stakers: ${ethers.formatUnits(totalDistributed, 6)}`);
console.log(`USDC to Treasury: ${ethers.formatUnits(totalToTreasury, 6)}`);
console.log(`Treasury Split: ${Number(treasuryBps) / 100}%`);
console.log(`Staker Split: ${100 - Number(treasuryBps) / 100}%`);
console.log(`RevenueShare: ${config.REVENUE_SHARE}`);

// User-specific if wallet configured
if (config.privateKey) {
  const wallet = new ethers.Wallet(config.privateKey, provider);
  const balance = await token.balanceOf(wallet.address);
  const staked = await rs.staked(wallet.address);
  const earned = await rs.earned(wallet.address);
  console.log(`\n═══ Your Position ═══`);
  console.log(`Wallet: ${wallet.address}`);
  console.log(`$${symbol} Balance: ${ethers.formatEther(balance)}`);
  console.log(`$${symbol} Staked: ${ethers.formatEther(staked)}`);
  console.log(`USDC Pending: ${ethers.formatUnits(earned, 6)}`);
}
