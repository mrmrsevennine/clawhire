// USDC wallet helpers using ethers.js
// Handles wallet loading, USDC transfers, and escrow interactions

const { ethers } = require('ethers');
const { config, requireConfig } = require('./config');

// Get provider
function getProvider() {
  return new ethers.JsonRpcProvider(config.rpcUrl, {
    chainId: config.chainId,
    name: config.network,
  });
}

// Get wallet (signer)
function getWallet() {
  requireConfig('privateKey');
  const provider = getProvider();
  return new ethers.Wallet(config.privateKey, provider);
}

// Get USDC contract instance
function getUsdcContract(signerOrProvider) {
  return new ethers.Contract(config.usdcAddress, config.erc20Abi, signerOrProvider);
}

// Get Escrow contract instance
function getEscrowContract(signerOrProvider) {
  requireConfig('escrowAddress');
  return new ethers.Contract(config.escrowAddress, config.escrowAbi, signerOrProvider);
}

// Convert USDC amount to smallest unit (6 decimals)
function parseUsdc(amount) {
  return ethers.parseUnits(String(amount), config.usdcDecimals);
}

// Convert from smallest unit to readable USDC
function formatUsdc(amount) {
  return ethers.formatUnits(amount, config.usdcDecimals);
}

// Generate a deterministic task ID from a string
function taskIdToBytes32(taskIdString) {
  return ethers.id(taskIdString);
}

// Check USDC balance
async function getUsdcBalance(address) {
  const provider = getProvider();
  const usdc = getUsdcContract(provider);
  const balance = await usdc.balanceOf(address);
  return formatUsdc(balance);
}

// Check native token balance (POL/MATIC)
async function getNativeBalance(address) {
  const provider = getProvider();
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
}

// Approve USDC spending for escrow contract
async function approveUsdcForEscrow(amount) {
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
async function transferUsdc(to, amount) {
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
async function createTaskOnChain(taskIdString, bountyAmount) {
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

// Claim task on escrow
async function claimTaskOnChain(taskIdString) {
  const wallet = getWallet();
  const escrow = getEscrowContract(wallet);
  const taskIdBytes = taskIdToBytes32(taskIdString);

  const tx = await escrow.claimTask(taskIdBytes);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, taskId: taskIdString, worker: wallet.address };
}

// Submit deliverable on escrow
async function submitDeliverableOnChain(taskIdString, deliverableHash) {
  const wallet = getWallet();
  const escrow = getEscrowContract(wallet);
  const taskIdBytes = taskIdToBytes32(taskIdString);
  const hashBytes = ethers.id(deliverableHash);

  const tx = await escrow.submitDeliverable(taskIdBytes, hashBytes);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, taskId: taskIdString, deliverableHash };
}

// Approve task on escrow (releases USDC)
async function approveTaskOnChain(taskIdString) {
  const wallet = getWallet();
  const escrow = getEscrowContract(wallet);
  const taskIdBytes = taskIdToBytes32(taskIdString);

  const tx = await escrow.approveTask(taskIdBytes);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, taskId: taskIdString };
}

// Dispute task on escrow
async function disputeTaskOnChain(taskIdString) {
  const wallet = getWallet();
  const escrow = getEscrowContract(wallet);
  const taskIdBytes = taskIdToBytes32(taskIdString);

  const tx = await escrow.disputeTask(taskIdBytes);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, taskId: taskIdString };
}

// Refund task on escrow
async function refundTaskOnChain(taskIdString) {
  const wallet = getWallet();
  const escrow = getEscrowContract(wallet);
  const taskIdBytes = taskIdToBytes32(taskIdString);

  const tx = await escrow.refund(taskIdBytes);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, taskId: taskIdString };
}

// Get on-chain task data
async function getOnChainTask(taskIdString) {
  const provider = getProvider();
  const escrow = getEscrowContract(provider);
  const taskIdBytes = taskIdToBytes32(taskIdString);

  const task = await escrow.getTask(taskIdBytes);
  return {
    poster: task.poster,
    worker: task.worker,
    bounty: formatUsdc(task.bounty),
    status: ['Open', 'Claimed', 'Submitted', 'Approved', 'Disputed', 'Refunded'][Number(task.status)],
    deliverableHash: task.deliverableHash,
    createdAt: new Date(Number(task.createdAt) * 1000).toISOString(),
    claimedAt: Number(task.claimedAt) > 0 ? new Date(Number(task.claimedAt) * 1000).toISOString() : null,
    submittedAt: Number(task.submittedAt) > 0 ? new Date(Number(task.submittedAt) * 1000).toISOString() : null,
  };
}

module.exports = {
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
  submitDeliverableOnChain,
  approveTaskOnChain,
  disputeTaskOnChain,
  refundTaskOnChain,
  getOnChainTask,
};
