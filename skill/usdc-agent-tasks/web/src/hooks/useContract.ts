import { BrowserProvider, Contract, parseUnits, formatUnits, id as ethId } from 'ethers';
import { ESCROW_ADDRESS, ESCROW_ABI, USDC_ADDRESS, ERC20_ABI } from '../lib/contract';

function getProvider(): BrowserProvider | null {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new BrowserProvider(window.ethereum);
  }
  return null;
}

export function useContract() {
  const createTaskOnChain = async (taskId: string, bountyUsdc: number) => {
    const provider = getProvider();
    if (!provider) throw new Error('No wallet connected');
    const signer = await provider.getSigner();
    const taskIdHash = ethId(taskId);
    const bountyAmount = parseUnits(bountyUsdc.toString(), 6);
    const usdc = new Contract(USDC_ADDRESS, ERC20_ABI, signer);
    const approveTx = await usdc.approve(ESCROW_ADDRESS, bountyAmount);
    await approveTx.wait();
    const escrow = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
    const tx = await escrow.createTask(taskIdHash, bountyAmount);
    await tx.wait();
    return tx.hash;
  };

  const bidOnTaskOnChain = async (taskId: string, priceUsdc: number, estimatedHours: number) => {
    const provider = getProvider();
    if (!provider) throw new Error('No wallet connected');
    const signer = await provider.getSigner();
    const escrow = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
    const priceAmount = parseUnits(priceUsdc.toString(), 6);
    const estimatedSeconds = estimatedHours * 3600;
    const tx = await escrow.bidOnTask(ethId(taskId), priceAmount, estimatedSeconds);
    await tx.wait();
    return tx.hash;
  };

  const acceptBidOnChain = async (taskId: string, bidderAddress: string) => {
    const provider = getProvider();
    if (!provider) throw new Error('No wallet connected');
    const signer = await provider.getSigner();
    const escrow = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
    const tx = await escrow.acceptBid(ethId(taskId), bidderAddress);
    await tx.wait();
    return tx.hash;
  };

  const claimTaskOnChain = async (taskId: string) => {
    const provider = getProvider();
    if (!provider) throw new Error('No wallet connected');
    const signer = await provider.getSigner();
    const escrow = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
    const tx = await escrow.claimTask(ethId(taskId));
    await tx.wait();
    return tx.hash;
  };

  const submitDeliverableOnChain = async (taskId: string, deliverableHash: string) => {
    const provider = getProvider();
    if (!provider) throw new Error('No wallet connected');
    const signer = await provider.getSigner();
    const escrow = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
    const tx = await escrow.submitDeliverable(ethId(taskId), ethId(deliverableHash));
    await tx.wait();
    return tx.hash;
  };

  const approveTaskOnChain = async (taskId: string) => {
    const provider = getProvider();
    if (!provider) throw new Error('No wallet connected');
    const signer = await provider.getSigner();
    const escrow = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
    const tx = await escrow.approveTask(ethId(taskId));
    await tx.wait();
    return tx.hash;
  };

  const disputeTaskOnChain = async (taskId: string) => {
    const provider = getProvider();
    if (!provider) throw new Error('No wallet connected');
    const signer = await provider.getSigner();
    const escrow = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
    const tx = await escrow.disputeTask(ethId(taskId));
    await tx.wait();
    return tx.hash;
  };

  const getOnChainStats = async () => {
    const provider = getProvider();
    if (!provider) throw new Error('No wallet connected');
    const escrow = new Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
    const [tasksCreated, tasksCompleted, volumeUsdc, feesCollected, currentFeeBps] = await escrow.getStats();
    return {
      tasksCreated: Number(tasksCreated),
      tasksCompleted: Number(tasksCompleted),
      volumeUsdc: Number(formatUnits(volumeUsdc, 6)),
      feesCollected: Number(formatUnits(feesCollected, 6)),
      currentFeeBps: Number(currentFeeBps),
    };
  };

  return {
    createTaskOnChain,
    bidOnTaskOnChain,
    acceptBidOnChain,
    claimTaskOnChain,
    submitDeliverableOnChain,
    approveTaskOnChain,
    disputeTaskOnChain,
    getOnChainStats,
  };
}
