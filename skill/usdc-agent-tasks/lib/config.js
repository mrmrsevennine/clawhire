// Network & contract configuration for USDC Agent Tasks
// Default: Polygon Amoy Testnet

import path from 'path';
import os from 'os';

export const config = {
  // Network
  network: process.env.TASK_NETWORK || 'polygon-amoy',
  rpcUrl: process.env.RPC_URL || 'https://rpc-amoy.polygon.technology',
  chainId: parseInt(process.env.CHAIN_ID || '80002'),

  // USDC on Polygon Amoy
  usdcAddress: process.env.USDC_ADDRESS || '0x41E94Eb71Ef8DC0523A4871B57AdB007b9e7e8dA',
  usdcDecimals: 6,

  // TaskEscrow contract (set after deployment)
  escrowAddress: process.env.ESCROW_ADDRESS || '',

  // Platform fee (2.5% = 250 basis points)
  platformFeeBps: 250,

  // Wallet
  privateKey: process.env.PRIVATE_KEY || '',

  // Storage
  dataDir: process.env.TASK_DATA_DIR || path.join(os.homedir(), '.openclaw', 'agent-tasks'),

  // Timeouts
  claimTimeoutSeconds: parseInt(process.env.CLAIM_TIMEOUT || String(7 * 24 * 3600)), // 7 days
  disputeWindowSeconds: parseInt(process.env.DISPUTE_WINDOW || String(3 * 24 * 3600)), // 3 days

  // ERC-20 ABI (minimal)
  erc20Abi: [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
  ],

  // TaskEscrow ABI (v2 with bidding, subtasks, and platform fee)
  escrowAbi: [
    // Core task functions
    'function createTask(bytes32 taskId, uint256 bountyAmount) external',
    'function claimTask(bytes32 taskId) external',
    'function submitDeliverable(bytes32 taskId, bytes32 deliverableHash) external',
    'function approveTask(bytes32 taskId) external',
    'function disputeTask(bytes32 taskId) external',
    'function refund(bytes32 taskId) external',
    'function cancelTask(bytes32 taskId) external',

    // Bidding functions
    'function bidOnTask(bytes32 taskId, uint256 price, uint256 estimatedTime) external',
    'function acceptBid(bytes32 taskId, address bidder) external',

    // Subtask functions
    'function createSubtask(bytes32 parentTaskId, bytes32 subtaskId, uint256 bountyAmount) external',
    'function getSubtasks(bytes32 parentTaskId) view returns (bytes32[])',

    // View functions
    'function getTask(bytes32 taskId) view returns (tuple(address poster, address worker, uint256 bounty, uint256 agreedPrice, uint8 status, bytes32 deliverableHash, uint256 createdAt, uint256 claimedAt, uint256 submittedAt, bytes32 parentTaskId, uint256 bidCount))',
    'function getTaskBids(bytes32 taskId) view returns (address[] bidders, tuple(address bidder, uint256 price, uint256 estimatedTime, uint256 timestamp, bool accepted)[] bids)',
    'function getBid(bytes32 taskId, address bidder) view returns (tuple(address bidder, uint256 price, uint256 estimatedTime, uint256 timestamp, bool accepted))',
    'function getStats() view returns (uint256 tasksCreated, uint256 tasksCompleted, uint256 volumeUsdc, uint256 feesCollected, uint256 currentFeeBps)',

    // Admin functions
    'function platformFeeBps() view returns (uint256)',
    'function feeRecipient() view returns (address)',
    'function setFee(uint256 newFeeBps) external',
    'function setFeeRecipient(address newRecipient) external',
    'function owner() view returns (address)',

    // Events
    'event TaskCreated(bytes32 indexed taskId, address indexed poster, uint256 bounty, bytes32 parentTaskId)',
    'event TaskBid(bytes32 indexed taskId, address indexed bidder, uint256 price, uint256 estimatedTime)',
    'event BidAccepted(bytes32 indexed taskId, address indexed bidder, uint256 price)',
    'event TaskClaimed(bytes32 indexed taskId, address indexed worker)',
    'event DeliverableSubmitted(bytes32 indexed taskId, bytes32 deliverableHash)',
    'event TaskApproved(bytes32 indexed taskId, address indexed worker, uint256 workerPayout, uint256 platformFee)',
    'event TaskDisputed(bytes32 indexed taskId)',
    'event TaskRefunded(bytes32 indexed taskId, address indexed poster, uint256 amount)',
    'event TaskCancelled(bytes32 indexed taskId, address indexed poster)',
    'event SubtaskCreated(bytes32 indexed parentTaskId, bytes32 indexed subtaskId, address indexed creator, uint256 bounty)',
    'event FeeUpdated(uint256 oldFeeBps, uint256 newFeeBps)',
    'event FeeRecipientUpdated(address oldRecipient, address newRecipient)',
  ],
};

// Status enum mapping
export const TaskStatus = {
  Open: 0,
  Claimed: 1,
  Submitted: 2,
  Approved: 3,
  Disputed: 4,
  Refunded: 5,
  Cancelled: 6,
};

export const StatusNames = ['open', 'claimed', 'submitted', 'approved', 'disputed', 'refunded', 'cancelled'];

// Validate required config
export function requireConfig(...keys) {
  const missing = keys.filter(k => !config[k]);
  if (missing.length > 0) {
    console.error(`❌ Missing required config: ${missing.join(', ')}`);
    console.error('Set via environment variables or .env file');
    process.exit(1);
  }
}

// Export for CommonJS compatibility
export default { config, requireConfig, TaskStatus, StatusNames };
