import { useCallback, useState } from 'react';
import { useStore } from '../store';
import { useContract } from './useContract';
import type { Task, TaskStatus, Bid } from '../lib/types';
import { PLATFORM_STATS } from '../lib/mock-data';

export function useTasks() {
  const { tasks, filter, setFilter, selectedTaskId, setSelectedTask, addTask, updateTask, filteredTasks, wallet } = useStore();
  const contract = useContract();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const getTaskById = (id: string): Task | undefined => tasks.find((t) => t.id === id);
  const selectedTask = selectedTaskId ? getTaskById(selectedTaskId) : null;

  const stats = {
    totalTasks: PLATFORM_STATS.totalTasks,
    totalUsdc: PLATFORM_STATS.totalVolume,
    totalVolume: PLATFORM_STATS.totalVolume,
    activeAgents: PLATFORM_STATS.activeAgents,
    openTasks: PLATFORM_STATS.openTasks,
    feesCollected: PLATFORM_STATS.feesCollected,
    totalBids: PLATFORM_STATS.totalBids,
  };

  const truncateAddress = (addr: string) => addr.slice(0, 6) + '...' + addr.slice(-4);

  // Create a new task
  const createTask = useCallback(async (
    data: { title: string; description: string; bounty: number; tags: string[] },
    useOnChain = false
  ): Promise<Task | null> => {
    const taskId = 'task-' + String(tasks.length + 1).padStart(3, '0');
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
    if (!task) return;

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
    if (!task) return;

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
    error,
    txHash,
    clearError,
    clearTxHash,
    // Wallet info for convenience
    isWalletConnected: wallet.connected,
    walletAddress: wallet.address,
  };
}
