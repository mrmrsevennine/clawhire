// Network & contract configuration for USDC Agent Tasks
// Default: Polygon Amoy Testnet

const config = {
  // Network
  network: process.env.TASK_NETWORK || 'polygon-amoy',
  rpcUrl: process.env.RPC_URL || 'https://rpc-amoy.polygon.technology',
  chainId: parseInt(process.env.CHAIN_ID || '80002'),

  // USDC on Polygon Amoy
  usdcAddress: process.env.USDC_ADDRESS || '0x41E94Eb71Ef8DC0523A4871B57AdB007b9e7e8dA',
  usdcDecimals: 6,

  // TaskEscrow contract (set after deployment)
  escrowAddress: process.env.ESCROW_ADDRESS || '',

  // Wallet
  privateKey: process.env.PRIVATE_KEY || '',

  // Storage
  dataDir: process.env.TASK_DATA_DIR || require('path').join(require('os').homedir(), '.openclaw', 'agent-tasks'),

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

  // TaskEscrow ABI
  escrowAbi: [
    'function createTask(bytes32 taskId, uint256 bountyAmount) external',
    'function claimTask(bytes32 taskId) external',
    'function submitDeliverable(bytes32 taskId, bytes32 deliverableHash) external',
    'function approveTask(bytes32 taskId) external',
    'function disputeTask(bytes32 taskId) external',
    'function refund(bytes32 taskId) external',
    'function getTask(bytes32 taskId) view returns (tuple(address poster, address worker, uint256 bounty, uint8 status, bytes32 deliverableHash, uint256 createdAt, uint256 claimedAt, uint256 submittedAt))',
    'event TaskCreated(bytes32 indexed taskId, address indexed poster, uint256 bounty)',
    'event TaskClaimed(bytes32 indexed taskId, address indexed worker)',
    'event DeliverableSubmitted(bytes32 indexed taskId, bytes32 deliverableHash)',
    'event TaskApproved(bytes32 indexed taskId, address indexed worker, uint256 bounty)',
    'event TaskDisputed(bytes32 indexed taskId)',
    'event TaskRefunded(bytes32 indexed taskId, address indexed poster, uint256 bounty)',
  ],
};

// Validate required config
function requireConfig(...keys) {
  const missing = keys.filter(k => !config[k]);
  if (missing.length > 0) {
    console.error(`❌ Missing required config: ${missing.join(', ')}`);
    console.error('Set via environment variables or .env file');
    process.exit(1);
  }
}

module.exports = { config, requireConfig };
