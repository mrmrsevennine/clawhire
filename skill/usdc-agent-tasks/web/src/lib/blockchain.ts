import { JsonRpcProvider, Contract, formatUnits, EventLog } from 'ethers';
import { ESCROW_ADDRESS, ESCROW_ABI, RPC_URL, CHAIN_ID } from './contract';
import type { Task, Bid, TaskStatus } from './types';

// Read-only provider for fetching blockchain data
const getReadProvider = () => new JsonRpcProvider(RPC_URL);

// Contract status enum mapping (from Solidity)
const STATUS_MAP: Record<number, TaskStatus> = {
  0: 'open',
  1: 'claimed',
  2: 'submitted',
  3: 'approved',
  4: 'disputed',
  5: 'refunded',
  6: 'cancelled',
};

// Helper to truncate address
const truncateAddress = (addr: string) => addr.slice(0, 6) + '...' + addr.slice(-4);

// Helper to format time ago
const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// Blockchain service for reading contract data
export const blockchainService = {
  // Check if we're on the correct network
  async checkNetwork(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.ethereum) return false;
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      return parseInt(chainId as string, 16) === CHAIN_ID;
    } catch {
      return false;
    }
  },

  // Get platform stats from contract
  async getStats(): Promise<{
    tasksCreated: number;
    tasksCompleted: number;
    volumeUsdc: number;
    feesCollected: number;
    currentFeeBps: number;
    registeredAgents: number;
  }> {
    try {
      const provider = getReadProvider();
      const contract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
      const result = await contract.getStats();

      return {
        tasksCreated: Number(result[0]),
        tasksCompleted: Number(result[1]),
        volumeUsdc: Number(formatUnits(result[2], 6)),
        feesCollected: Number(formatUnits(result[3], 6)),
        currentFeeBps: Number(result[4]),
        registeredAgents: Number(result[5]),
      };
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return {
        tasksCreated: 0,
        tasksCompleted: 0,
        volumeUsdc: 0,
        feesCollected: 0,
        currentFeeBps: 250,
        registeredAgents: 0,
      };
    }
  },

  // Get user reputation from contract
  async getReputation(address: string): Promise<{
    tasksCompleted: number;
    tasksPosted: number;
    totalEarned: number;
    totalSpent: number;
    disputesAsWorker: number;
    disputesAsPoster: number;
    registeredAt: number;
  }> {
    try {
      const provider = getReadProvider();
      const contract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
      const result = await contract.getReputation(address);

      return {
        tasksCompleted: Number(result.tasksCompleted),
        tasksPosted: Number(result.tasksPosted),
        totalEarned: Number(formatUnits(result.totalEarned, 6)),
        totalSpent: Number(formatUnits(result.totalSpent, 6)),
        disputesAsWorker: Number(result.disputesAsWorker),
        disputesAsPoster: Number(result.disputesAsPoster),
        registeredAt: Number(result.registeredAt) * 1000,
      };
    } catch (error) {
      console.error('Failed to fetch reputation:', error);
      return {
        tasksCompleted: 0,
        tasksPosted: 0,
        totalEarned: 0,
        totalSpent: 0,
        disputesAsWorker: 0,
        disputesAsPoster: 0,
        registeredAt: 0,
      };
    }
  },

  // Get a single task from the contract
  async getTask(taskIdHash: string): Promise<{
    poster: string;
    worker: string;
    bounty: number;
    agreedPrice: number;
    status: TaskStatus;
    deliverableHash: string;
    createdAt: number;
    claimedAt: number;
    submittedAt: number;
    parentTaskId: string;
    bidCount: number;
  } | null> {
    try {
      const provider = getReadProvider();
      const contract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
      const result = await contract.getTask(taskIdHash);

      if (result.poster === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      return {
        poster: result.poster,
        worker: result.worker,
        bounty: Number(formatUnits(result.bounty, 6)),
        agreedPrice: Number(formatUnits(result.agreedPrice, 6)),
        status: STATUS_MAP[Number(result.status)] || 'open',
        deliverableHash: result.deliverableHash,
        createdAt: Number(result.createdAt) * 1000,
        claimedAt: Number(result.claimedAt) * 1000,
        submittedAt: Number(result.submittedAt) * 1000,
        parentTaskId: result.parentTaskId,
        bidCount: Number(result.bidCount),
      };
    } catch (error) {
      console.error('Failed to fetch task:', error);
      return null;
    }
  },

  // Get bids for a task
  async getTaskBids(taskIdHash: string): Promise<Bid[]> {
    try {
      const provider = getReadProvider();
      const contract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
      const result = await contract.getTaskBids(taskIdHash);

      const bids: Bid[] = result.bids.map((bid: { bidder: string; price: bigint; estimatedTime: bigint; timestamp: bigint; accepted: boolean }) => ({
        bidder: truncateAddress(bid.bidder),
        bidderFull: bid.bidder,
        price: Number(formatUnits(bid.price, 6)),
        estimatedHours: Math.round(Number(bid.estimatedTime) / 3600),
        timestamp: Number(bid.timestamp) * 1000,
        accepted: bid.accepted,
      }));

      return bids;
    } catch (error) {
      console.error('Failed to fetch bids:', error);
      return [];
    }
  },

  // Fetch all tasks from blockchain events
  async fetchAllTasks(fromBlock: number = 0): Promise<Task[]> {
    try {
      const provider = getReadProvider();
      const contract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);

      const currentBlock = await provider.getBlockNumber();
      const startBlock = Math.max(fromBlock, currentBlock - 100000);

      const taskCreatedFilter = contract.filters.TaskCreated();
      const taskCreatedEvents = await contract.queryFilter(taskCreatedFilter, startBlock, currentBlock);

      const tasks: Task[] = [];

      for (const event of taskCreatedEvents) {
        if (!(event instanceof EventLog)) continue;

        const taskId = event.args[0] as string;
        const poster = event.args[1] as string;
        const bounty = Number(formatUnits(event.args[2] as bigint, 6));
        const parentTaskId = event.args[3] as string;
        const block = await event.getBlock();
        const timestamp = block.timestamp * 1000;

        const taskData = await this.getTask(taskId);
        const bids = await this.getTaskBids(taskId);

        if (!taskData) continue;

        const task: Task = {
          id: taskId,
          title: `Task ${taskId.slice(0, 10)}...`,
          description: 'On-chain task',
          bounty,
          agreedPrice: taskData.agreedPrice > 0 ? taskData.agreedPrice : undefined,
          status: taskData.status,
          tags: ['on-chain'],
          poster: truncateAddress(poster),
          posterFull: poster,
          worker: taskData.worker !== '0x0000000000000000000000000000000000000000'
            ? truncateAddress(taskData.worker)
            : null,
          workerFull: taskData.worker !== '0x0000000000000000000000000000000000000000'
            ? taskData.worker
            : null,
          timePosted: formatTimeAgo(timestamp),
          createdAt: timestamp,
          claimedAt: taskData.claimedAt > 0 ? taskData.claimedAt : undefined,
          submittedAt: taskData.submittedAt > 0 ? taskData.submittedAt : undefined,
          deliverable: taskData.deliverableHash !== '0x0000000000000000000000000000000000000000000000000000000000000000'
            ? taskData.deliverableHash
            : undefined,
          bids,
          bidCount: bids.length,
          parentTaskId: parentTaskId !== '0x0000000000000000000000000000000000000000000000000000000000000000'
            ? parentTaskId
            : undefined,
          onchain: true,
          txHash: event.transactionHash,
        };

        tasks.push(task);
      }

      return tasks.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Failed to fetch tasks from blockchain:', error);
      return [];
    }
  },
};
