#!/usr/bin/env node
// Stake $HIRE tokens into RevenueShare contract
import { ethers } from 'ethers';
import { config } from '../lib/config.js';

const REVENUE_SHARE_ABI = [
  'function stake(uint256 amount) external',
  'function staked(address) view returns (uint256)',
  'function totalStaked() view returns (uint256)',
];
const ERC20_ABI = [
  'function approve(address,uint256) returns (bool)',
  'function allowance(address,address) view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function symbol() view returns (string)',
];

const amount = process.argv[2];
if (!amount) {
  console.error('Usage: node token-stake.js <amount>');
  console.error('  amount: number of $HIRE tokens to stake (e.g. 1000)');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(config.rpcUrl);
const wallet = new ethers.Wallet(config.privateKey, provider);
const amountWei = ethers.parseEther(amount);

const token = new ethers.Contract(config.HIRE_TOKEN, ERC20_ABI, wallet);
const rs = new ethers.Contract(config.REVENUE_SHARE, REVENUE_SHARE_ABI, wallet);

const symbol = await token.symbol();
const balance = await token.balanceOf(wallet.address);
console.log(`Wallet: ${wallet.address}`);
console.log(`$${symbol} balance: ${ethers.formatEther(balance)}`);

if (balance < amountWei) {
  console.error(`Insufficient balance. Have ${ethers.formatEther(balance)}, need ${amount}`);
  process.exit(1);
}

// Check and set allowance
const allowance = await token.allowance(wallet.address, config.REVENUE_SHARE);
if (allowance < amountWei) {
  console.log(`Approving ${amount} $${symbol}...`);
  const approveTx = await token.approve(config.REVENUE_SHARE, amountWei);
  await approveTx.wait();
  console.log('✅ Approved');
}

console.log(`Staking ${amount} $${symbol}...`);
const tx = await rs.stake(amountWei);
const receipt = await tx.wait();
console.log(`✅ Staked! TX: ${receipt.hash}`);

const staked = await rs.staked(wallet.address);
const total = await rs.totalStaked();
console.log(`Your stake: ${ethers.formatEther(staked)} $${symbol}`);
console.log(`Total staked: ${ethers.formatEther(total)} $${symbol}`);
