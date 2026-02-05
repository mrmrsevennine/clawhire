// USDC wallet helpers using ethers.js
// Handles wallet loading, USDC transfers, and escrow interactions

import { ethers } from 'ethers';
import { config, requireConfig, StatusNames } from './config.js';

// Get provider
export function getProvider() {
  return new ethers.JsonRpcProvider(config.rpcUrl, {
    chainId: config.chainId,
    name: config.network,
  });
}

// Get wallet (signer)
export function getWallet() {
  requireConfig('privateKey');
  const provider = getProvider();
  return new ethers.Wallet(config.privateKey, provider);
}

// Get USDC contract instance
export function getUsdcContract(signerOrProvider) {
  return new ethers.Contract(config.usdcAddress, config.erc20Abi, signerOrProvider);
}

// Get Escrow contract instance
export function getEscrowContract(signerOrProvider) {
  requireConfig('escrowAddress');
  return new ethers.Contract(config.escrowAddress, config.escrowAbi, signerOrProvider);
}

// Convert USDC amount to smallest unit (6 decimals)
export function parseUsdc(amount) {
  return ethers.parseUnits(String(amount), config.usdcDecimals);
}

// Convert from smallest unit to readable USDC
export function formatUsdc(amount) {
  return ethers.formatUnits(amount, config.usdcDecimals);
}

// Generate a deterministic task ID from a string
export function taskIdToBytes32(taskIdString) {
  return ethers.id(taskIdString);
}

// Check USDC balance
export async function getUsdcBalance(address) {
  const provider = getProvider();
  const usdc = getUsdcContract(provider);
  const balance = await usdc.balanceOf(address);
  return formatUsdc(balance);
}

// Check native token balance (POL/MATIC)
export async function getNativeBalance(address) {
  const provider = getProvider();
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

// Approve USDC spending for escrow contract
export async function approveUsdcForEscrow(amount) {
  const wallet = getWallet();
  const usdc = getUsdcContract(wallet);
  const parsedAmount = parseUsdc(amount);

  // Check current allowance
  const currentAllowance = await usdc.allowance(wallet.address, config.escrowAddress);
  if (currentAllowance >= parsedAmount) {
    return { alreadyApproved: true, allowance: formatUsdc(currentAllowance) };
  }

  const tx = await usdc.approve(config.escrowAddress, parsedAmount);
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    amount: formatUsdc(parsedAmount),
    spender: config.escrowAddress,
  };
}

// Direct USDC transfer (for off-chain mode)
export async function transferUsdc(to, amount) {
  const wallet = getWallet();
  const usdc = getUsdcContract(wallet);
  const parsedAmount = parseUsdc(amount);

  const tx = await usdc.transfer(to, parsedAmount);
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    from: wallet.address,
    to,
    amount: formatUsdc(parsedAmount),
  };
}

// Create task on escrow contract
export async function createTaskOnChain(taskIdString, bountyAmount) {
  const wallet = getWallet();
  const escrow = getEscrowContract(wallet);
  const taskIdBytes = taskIdToBytes32(taskIdString);
  const parsedBounty = parseUsdc(bountyAmount);

  // First approve USDC
  await approveUsdcForEscrow(bountyAmount);

  // Create task
  const tx = await escrow.createTask(taskIdBytes, parsedBounty);
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    taskId: taskIdString,
    taskIdBytes: taskIdBytes,
    bounty: bountyAmount,
  };
}

// Claim task on escrow (legacy direct claim)
export async function claimTaskOnChain(taskIdString) {
  const wallet = getWallet();
  const escrow = getEscrowContract(wallet);
  const taskIdBytes = taskIdToBytes32(taskIdString);

  const tx = await escrow.claimTask(taskIdBytes);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, taskId: taskIdString, worker: wallet.address };
}

// ===========================================
// NEW: Bidding functions
// ===========================================

// Place a bid on a task
export async function bidOnTaskOnChain(taskIdString, bidPrice, estimatedTimeSeconds) {
  const wallet = getWallet();
  const escrow = getEscrowContract(wallet);
  const taskIdBytes = taskIdToBytes32(taskIdString);
  const parsedPrice = parseUsdc(bidPrice);

  const tx = await escrow.bidOnTask(taskIdBytes, parsedPrice, BigInt(estimatedTimeSeconds));
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    taskId: taskIdString,
    bidder: wallet.address,
    price: bidPrice,
    estimatedTime: estimatedTimeSeconds,
  };
}

// Accept a bid on your task
export async function acceptBidOnChain(taskIdString, bidderAddress) {
  const wallet = getWallet();
  const escrow = getEscrowContract(wallet);
  const taskIdBytes = taskIdToBytes32(taskIdString);

  const tx = await escrow.acceptBid(taskIdBytes, bidderAddress);
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    taskId: taskIdString,
    acceptedBidder: bidderAddress,
  };
}

// Get all bids for a task
export async function getTaskBidsOnChain(taskIdString) {
  const provider = getProvider();
  const escrow = getEscrowContract(provider);
  const taskIdBytes = taskIdToBytes32(taskIdString);

  const [bidders, bids] = await escrow.getTaskBids(taskIdBytes);
  return bidders.map((bidder, i) => ({
    bidder,
    price: formatUsdc(bids[i].price),
    estimatedTime: Number(bids[i].estimatedTime),
    timestamp: new Date(Number(bids[i].timestamp) * 1000).toISOString(),
    accepted: bids[i].accepted,
  }));
}

// ===========================================
// NEW: Subtask functions
// ===========================================

// Create a subtask (agent-to-agent subcontracting)
export async function createSubtaskOnChain(parentTaskIdString, subtaskIdString, bountyAmount) {
  const wallet = getWallet();
  const escrow = getEscrowContract(wallet);
  const parentTaskIdBytes = taskIdToBytes32(parentTaskIdString);
  const subtaskIdBytes = taskIdToBytes32(subtaskIdString);
  const parsedBounty = parseUsdc(bountyAmount);

  // First approve USDC
  await approveUsdcForEscrow(bountyAmount);

  const tx = await escrow.createSubtask(parentTaskIdBytes, subtaskIdBytes, parsedBounty);
  const receipt = await tx.wait();
  return {
    txHash: receipt.hash,
    parentTaskId: parentTaskIdString,
    subtaskId: subtaskIdString,
    bounty: bountyAmount,
  };
}

// Get subtasks for a parent task
export async function getSubtasksOnChain(parentTaskIdString) {
  const provider = getProvider();
  const escrow = getEscrowContract(provider);
  const parentTaskIdBytes = taskIdToBytes32(parentTaskIdString);

  const subtaskIds = await escrow.getSubtasks(parentTaskIdBytes);
  return subtaskIds;
}

// ===========================================
// Deliverable & Approval functions
// ===========================================

// Submit deliverable on escrow
export async function submitDeliverableOnChain(taskIdString, deliverableHash) {
  const wallet = getWallet();
  const escrow = getEscrowContract(wallet);
  const taskIdBytes = taskIdToBytes32(taskIdString);
  const hashBytes = ethers.id(deliverableHash);

  const tx = await escrow.submitDeliverable(taskIdBytes, hashBytes);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, taskId: taskIdString, deliverableHash };
}

// Approve task on escrow (releases USDC minus platform fee)
export async function approveTaskOnChain(taskIdString) {
  const wallet = getWallet();
  const escrow = getEscrowContract(wallet);
  const taskIdBytes = taskIdToBytes32(taskIdString);

  const tx = await escrow.approveTask(taskIdBytes);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, taskId: taskIdString };
}

// Dispute task on escrow
export async function disputeTaskOnChain(taskIdString) {
  const wallet = getWallet();
  const escrow = getEscrowContract(wallet);
  const taskIdBytes = taskIdToBytes32(taskIdString);

  const tx = await escrow.disputeTask(taskIdBytes);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, taskId: taskIdString };
}

// Refund task on escrow
export async function refundTaskOnChain(taskIdString) {
  const wallet = getWallet();
  const escrow = getEscrowContract(wallet);
  const taskIdBytes = taskIdToBytes32(taskIdString);

  const tx = await escrow.refund(taskIdBytes);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, taskId: taskIdString };
}

// Cancel an open task
export async function cancelTaskOnChain(taskIdString) {
  const wallet = getWallet();
  const escrow = getEscrowContract(wallet);
  const taskIdBytes = taskIdToBytes32(taskIdString);

  const tx = await escrow.cancelTask(taskIdBytes);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, taskId: taskIdString };
}

// ===========================================
// View functions
// ===========================================

// Get on-chain task data
export async function getOnChainTask(taskIdString) {
  const provider = getProvider();
  const escrow = getEscrowContract(provider);
  const taskIdBytes = taskIdToBytes32(taskIdString);

  const task = await escrow.getTask(taskIdBytes);
  return {
    poster: task.poster,
    worker: task.worker,
    bounty: formatUsdc(task.bounty),
    agreedPrice: formatUsdc(task.agreedPrice),
    status: StatusNames[Number(task.status)],
    statusCode: Number(task.status),
    deliverableHash: task.deliverableHash,
    createdAt: new Date(Number(task.createdAt) * 1000).toISOString(),
    claimedAt: Number(task.claimedAt) > 0 ? new Date(Number(task.claimedAt) * 1000).toISOString() : null,
    submittedAt: Number(task.submittedAt) > 0 ? new Date(Number(task.submittedAt) * 1000).toISOString() : null,
    parentTaskId: task.parentTaskId,
    bidCount: Number(task.bidCount),
  };
}

// Get platform statistics
export async function getPlatformStats() {
  const provider = getProvider();
  const escrow = getEscrowContract(provider);

  const stats = await escrow.getStats();
  return {
    tasksCreated: Number(stats[0]),
    tasksCompleted: Number(stats[1]),
    volumeUsdc: formatUsdc(stats[2]),
    feesCollected: formatUsdc(stats[3]),
    currentFeeBps: Number(stats[4]),
    currentFeePercent: Number(stats[4]) / 100, // Convert bps to percentage
  };
}

// Export all functions
export default {
  getProvider,
  getWallet,
  getUsdcContract,
  getEscrowContract,
  parseUsdc,
  formatUsdc,
  taskIdToBytes32,
  getUsdcBalance,
  getNativeBalance,
  approveUsdcForEscrow,
  transferUsdc,
  createTaskOnChain,
  claimTaskOnChain,
  bidOnTaskOnChain,
  acceptBidOnChain,
  getTaskBidsOnChain,
  createSubtaskOnChain,
  getSubtasksOnChain,
  submitDeliverableOnChain,
  approveTaskOnChain,
  disputeTaskOnChain,
  refundTaskOnChain,
  cancelTaskOnChain,
  getOnChainTask,
  getPlatformStats,
};
