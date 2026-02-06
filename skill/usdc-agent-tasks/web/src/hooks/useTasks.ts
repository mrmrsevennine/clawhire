import { useCallback, useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { useContract } from './useContract';
import type { Task, TaskStatus, Bid } from '../lib/types';
import { MOCK_LEADERBOARD } from '../lib/mock-data';
import { blockchainService } from '../lib/blockchain';

export function useTasks() {
  const { tasks, filter, setFilter, tagFilter, setTagFilter, allTags, selectedTaskId, setSelectedTask, addTask, updateTask, filteredTasks, wallet } = useStore();
  const contract = useContract();
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [onChainStats, setOnChainStats] = useState<{
    tasksCreated: number;
    tasksCompleted: number;
    volumeUsdc: number;
    registeredAgents: number;
  } | null>(null);

  // Fetch on-chain stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const stats = await blockchainService.getStats();
        setOnChainStats(stats);
      } catch (err) {
        console.error('Failed to fetch on-chain stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const getTaskById = (id: string): Task | undefined => tasks.find((t) => t.id === id);
  const selectedTask = selectedTaskId ? getTaskById(selectedTaskId) : null;

  // Compute stats - prefer on-chain data when available
  const stats = useMemo(() => {
    const localOpenTasks = tasks.filter(t => t.status === 'open').length;
    const localCompletedTasks = tasks.filter(t => t.status === 'approved').length;
    const localTotalVolume = tasks.reduce((sum, t) => sum + t.bounty, 0);
    const totalBids = tasks.reduce((sum, t) => sum + (t.bidCount || 0), 0);
    const feesCollected = Math.round(
      tasks.filter(t => t.status === 'approved')
        .reduce((sum, t) => sum + (t.agreedPrice || t.bounty), 0) * 0.025 * 100
    ) / 100;

    // Use on-chain stats if available, otherwise use local data
    return {
      totalTasks: onChainStats?.tasksCreated || tasks.length,
      totalUsdc: onChainStats?.volumeUsdc || localTotalVolume,
      totalVolume: onChainStats?.volumeUsdc || localTotalVolume,
      activeAgents: onChainStats?.registeredAgents || MOCK_LEADERBOARD.length,
      openTasks: localOpenTasks,
      completedTasks: onChainStats?.tasksCompleted || localCompletedTasks,
      feesCollected,
      totalBids,
    };
  }, [tasks, onChainStats]);

  const truncateAddress = (addr: string) => addr.slice(0, 6) + '...' + addr.slice(-4);

  // Create a new task
  const createTask = useCallback(async (
    data: { title: string; description: string; bounty: number; tags: string[] },
    useOnChain = false
  ): Promise<Task | null> => {
    const taskId = 'task-' + crypto.randomUUID().slice(0, 8);
    const posterAddr = wallet.address || '0xYourAddress';

    const newTask: Task = {
      id: taskId,
      title: data.title,
      description: data.description,
      bounty: data.bounty,
      status: 'open',
      tags: data.tags,
      poster: truncateAddress(posterAddr),
      posterFull: posterAddr,
      worker: null,
      workerFull: null,
      timePosted: 'just now',
      createdAt: Date.now(),
      bids: [],
      bidCount: 0,
      onchain: useOnChain,
    };

    if (useOnChain && wallet.connected) {
      setLoading(true);
      setError(null);
      try {
        const hash = await contract.createTaskOnChain(taskId, data.bounty);
        newTask.txHash = hash;
        setTxHash(hash);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Transaction failed');
        setLoading(false);
        return null;
      }
      setLoading(false);
    }

    addTask(newTask);
    return newTask;
  }, [tasks.length, wallet, contract, addTask]);

  // Place a bid on a task
  const placeBid = useCallback(async (taskId: string, price: number, estimatedHours: number, useOnChain = false) => {
    const task = getTaskById(taskId);
    if (!task) throw new Error('Task not found');

    // Validation: bid must not exceed bounty
    if (price > task.bounty) throw new Error(`Bid cannot exceed bounty ($${task.bounty} USDC)`);
    if (price <= 0) throw new Error('Bid must be greater than 0');
    if (estimatedHours <= 0) throw new Error('Estimated hours must be greater than 0');

    // Validation: poster cannot bid on own task
    if (wallet.address?.toLowerCase() === task.posterFull?.toLowerCase()) {
      throw new Error('Cannot bid on your own task');
    }

    // Validation: cannot bid twice
    const existingBid = task.bids?.find(b => b.bidderFull?.toLowerCase() === wallet.address?.toLowerCase());
    if (existingBid) throw new Error('You have already placed a bid on this task');

    const bidderAddr = wallet.address || '0xYourAddress';

    if (useOnChain && wallet.connected) {
      setLoading(true);
      setError(null);
      try {
        const hash = await contract.bidOnTaskOnChain(taskId, price, estimatedHours);
        setTxHash(hash);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bid transaction failed');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    const newBid: Bid = {
      bidder: truncateAddress(bidderAddr),
      bidderFull: bidderAddr,
      price,
      estimatedHours,
      timestamp: Date.now(),
      accepted: false,
    };

    const updatedBids = [...(task.bids || []), newBid];
    updateTask(taskId, {
      bids: updatedBids,
      bidCount: updatedBids.length,
    });
  }, [wallet, contract, updateTask, getTaskById]);

  // Accept a bid
  const acceptBid = useCallback(async (taskId: string, bidderAddress: string, useOnChain = false) => {
    const task = getTaskById(taskId);
    if (!task) throw new Error('Task not found');

    // Validation: only poster can accept bids
    if (wallet.address?.toLowerCase() !== task.posterFull?.toLowerCase()) {
      throw new Error('Only the task poster can accept bids');
    }

    if (useOnChain && wallet.connected) {
      setLoading(true);
      setError(null);
      try {
        const hash = await contract.acceptBidOnChain(taskId, bidderAddress);
        setTxHash(hash);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Accept bid failed');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    const updatedBids = (task.bids || []).map((bid) =>
      bid.bidderFull === bidderAddress ? { ...bid, accepted: true } : bid
    );
    const acceptedBid = updatedBids.find((b) => b.accepted);

    updateTask(taskId, {
      status: 'claimed' as TaskStatus,
      worker: acceptedBid?.bidder || null,
      workerFull: bidderAddress,
      agreedPrice: acceptedBid?.price,
      bids: updatedBids,
      claimedAt: Date.now(),
    });
  }, [wallet, contract, updateTask, getTaskById]);

  // Direct claim (legacy)
  const claimTask = useCallback(async (taskId: string, useOnChain = false) => {
    const taskToCheck = getTaskById(taskId);
    if (taskToCheck && wallet.address?.toLowerCase() === taskToCheck.posterFull?.toLowerCase()) {
      throw new Error('Cannot claim your own task');
    }

    if (useOnChain && wallet.connected) {
      setLoading(true);
      setError(null);
      try {
        const hash = await contract.claimTaskOnChain(taskId);
        setTxHash(hash);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Claim failed');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    const workerAddr = wallet.address || '0xYourAddress';
    updateTask(taskId, {
      status: 'claimed' as TaskStatus,
      worker: truncateAddress(workerAddr),
      workerFull: workerAddr,
      claimedAt: Date.now(),
    });
  }, [wallet, contract, updateTask]);

  // Submit deliverable
  const submitDeliverable = useCallback(async (taskId: string, deliverable: string, useOnChain = false) => {
    const taskToCheck = getTaskById(taskId);
    if (taskToCheck && wallet.address?.toLowerCase() !== taskToCheck.workerFull?.toLowerCase()) {
      throw new Error('Only the assigned worker can submit deliverables');
    }

    if (useOnChain && wallet.connected) {
      setLoading(true);
      setError(null);
      try {
        const hash = await contract.submitDeliverableOnChain(taskId, deliverable);
        setTxHash(hash);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Submit failed');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    updateTask(taskId, {
      status: 'submitted' as TaskStatus,
      deliverable,
      submittedAt: Date.now(),
    });
  }, [wallet, contract, updateTask]);

  // Approve task
  const approveTask = useCallback(async (taskId: string, useOnChain = false) => {
    const taskToCheck = getTaskById(taskId);
    if (taskToCheck && wallet.address?.toLowerCase() !== taskToCheck.posterFull?.toLowerCase()) {
      throw new Error('Only the task poster can approve deliverables');
    }

    if (useOnChain && wallet.connected) {
      setLoading(true);
      setError(null);
      try {
        const hash = await contract.approveTaskOnChain(taskId);
        setTxHash(hash);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Approval failed');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    updateTask(taskId, {
      status: 'approved' as TaskStatus,
      approvedAt: Date.now(),
    });
  }, [wallet, contract, updateTask]);

  // Dispute task
  const disputeTask = useCallback(async (taskId: string, useOnChain = false) => {
    const taskToCheck = getTaskById(taskId);
    if (taskToCheck && wallet.address?.toLowerCase() !== taskToCheck.posterFull?.toLowerCase()) {
      throw new Error('Only the task poster can file disputes');
    }

    if (useOnChain && wallet.connected) {
      setLoading(true);
      setError(null);
      try {
        const hash = await contract.disputeTaskOnChain(taskId);
        setTxHash(hash);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Dispute failed');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    updateTask(taskId, { status: 'disputed' as TaskStatus });
  }, [wallet, contract, updateTask]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);
  const clearTxHash = useCallback(() => setTxHash(null), []);

  return {
    tasks,
    filter,
    setFilter,
    tagFilter,
    setTagFilter,
    allTags: allTags(),
    filteredTasks: filteredTasks(),
    selectedTask,
    selectedTaskId,
    setSelectedTask,
    getTaskById,
    stats,
    // Actions
    createTask,
    placeBid,
    acceptBid,
    claimTask,
    submitDeliverable,
    approveTask,
    disputeTask,
    // State
    loading,
    loadingStats,
    error,
    txHash,
    clearError,
    clearTxHash,
    // Wallet info for convenience
    isWalletConnected: wallet.connected,
    walletAddress: wallet.address,
  };
}
