export const CHAIN_ID = 80002;
export const CHAIN_NAME = 'Polygon Amoy Testnet';
export const RPC_URL = 'https://rpc-amoy.polygon.technology';
export const BLOCK_EXPLORER = 'https://amoy.polygonscan.com/';

export const USDC_ADDRESS = '0x41E94Eb71Ef8DC0523A4871B57AdB007b9e7e8dA';
export const ESCROW_ADDRESS = '0x0000000000000000000000000000000000000000'; // Replace with deployed address

export const ESCROW_ABI = [
  'function createTask(bytes32 taskId, uint256 bountyAmount) external',
  'function claimTask(bytes32 taskId) external',
  'function submitDeliverable(bytes32 taskId, bytes32 deliverableHash) external',
  'function approveTask(bytes32 taskId) external',
  'function disputeTask(bytes32 taskId) external',
  'function refund(bytes32 taskId) external',
  'function getTask(bytes32 taskId) view returns (tuple(address poster, address worker, uint256 bounty, uint8 status, bytes32 deliverableHash, uint256 createdAt, uint256 claimedAt, uint256 submittedAt))',
  'event TaskCreated(bytes32 indexed taskId, address indexed poster, uint256 bounty)',
  'event TaskClaimed(bytes32 indexed taskId, address indexed worker)',
  'event TaskApproved(bytes32 indexed taskId, address indexed worker, uint256 bounty)',
] as const;

export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
] as const;
