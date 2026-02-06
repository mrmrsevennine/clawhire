// === Network Configuration ===
// Polygon Amoy (primary)
export const CHAIN_ID = 80002;
export const CHAIN_NAME = 'Polygon Amoy Testnet';
export const RPC_URL = 'https://rpc-amoy.polygon.technology';
export const BLOCK_EXPLORER = 'https://amoy.polygonscan.com/';

// Base Sepolia (secondary — CCTP cross-chain roadmap)
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
export const BASE_SEPOLIA_EXPLORER = 'https://sepolia.basescan.org/';

// USDC addresses (Circle testnet faucet)
export const USDC_ADDRESS = '0x41E94Eb71Ef8DC0523A4871B57AdB007b9e7e8dA'; // Polygon Amoy
export const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia

// Escrow contract — deploy with: npx hardhat run scripts/deploy.js --network amoy
export const ESCROW_ADDRESS = '0x0000000000000000000000000000000000000000'; // Replace after deployment

export const ESCROW_ABI = [
  // Task creation
  'function createTask(bytes32 taskId, uint256 bountyAmount) external',
  'function createSubtask(bytes32 parentTaskId, bytes32 subtaskId, uint256 bountyAmount) external',

  // Bidding system
  'function bidOnTask(bytes32 taskId, uint256 price, uint256 estimatedTime) external',
  'function acceptBid(bytes32 taskId, address bidder) external',
  'function claimTask(bytes32 taskId) external',

  // Deliverables & Approval
  'function submitDeliverable(bytes32 taskId, bytes32 deliverableHash) external',
  'function approveTask(bytes32 taskId) external',
  'function autoApprove(bytes32 taskId) external',
  'function disputeTask(bytes32 taskId) external',
  'function resolveDispute(bytes32 taskId) external',
  'function refund(bytes32 taskId) external',
  'function cancelTask(bytes32 taskId) external',

  // Reputation
  'function getReputation(address agent) view returns (tuple(uint256 tasksCompleted, uint256 tasksPosted, uint256 totalEarned, uint256 totalSpent, uint256 disputesAsWorker, uint256 disputesAsPoster, uint256 registeredAt))',
  'function getAgentTier(address agent) view returns (uint8)',
  'function getAgentCompletedTasks(address agent) view returns (bytes32[])',
  'function getAgentPostedTasks(address agent) view returns (bytes32[])',

  // View functions
  'function getTask(bytes32 taskId) view returns (tuple(address poster, address worker, uint256 bounty, uint256 agreedPrice, uint8 status, bytes32 deliverableHash, uint256 createdAt, uint256 claimedAt, uint256 submittedAt, bytes32 parentTaskId, uint256 bidCount))',
  'function getTaskBids(bytes32 taskId) view returns (address[] bidders, tuple(address bidder, uint256 price, uint256 estimatedTime, uint256 timestamp, bool accepted)[] bids)',
  'function getBid(bytes32 taskId, address bidder) view returns (tuple(address bidder, uint256 price, uint256 estimatedTime, uint256 timestamp, bool accepted))',
  'function getSubtasks(bytes32 parentTaskId) view returns (bytes32[])',
  'function getStats() view returns (uint256 tasksCreated, uint256 tasksCompleted, uint256 volumeUsdc, uint256 feesCollected, uint256 currentFeeBps, uint256 registeredAgents)',
  'function platformFeeBps() view returns (uint256)',
  'function paused() view returns (bool)',

  // Admin
  'function pause() external',
  'function unpause() external',

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
  'event DisputeResolved(bytes32 indexed taskId, uint256 posterShare, uint256 workerShare)',
  'event AgentRegistered(address indexed agent)',
] as const;

export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
] as const;
