import { useState } from 'react';
import { useStore } from '../store';
import { useTasks } from '../hooks/useTasks';
import { toast } from './Toast';

export function PostTaskModal() {
  const postModalOpen = useStore((s) => s.postModalOpen);
  const setPostModalOpen = useStore((s) => s.setPostModalOpen);
  const { createTask, loading, isWalletConnected } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bounty, setBounty] = useState('');
  const [tags, setTags] = useState('');
  const [onChain, setOnChain] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!postModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !bounty) return;

    // Check wallet for on-chain
    if (onChain && !isWalletConnected) {
      toast.error('Connect your wallet to post on-chain tasks');
      return;
    }

    setIsSubmitting(true);
    const toastId = onChain ? toast.loading('Creating on-chain task...') : null;

    try {
      const result = await createTask(
        {
          title: title.trim(),
          description: description.trim(),
          bounty: parseFloat(bounty),
          tags: tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        },
        onChain
      );

      if (toastId) toast.dismiss(toastId);

      if (result) {
        toast.success(
          onChain ? 'Task posted on-chain!' : 'Task created!',
          result.txHash
        );
        setTitle('');
        setDescription('');
        setBounty('');
        setTags('');
        setOnChain(true);
        setPostModalOpen(false);
      } else if (onChain) {
        toast.error('Transaction failed. Please try again.');
      }
    } catch (err) {
      if (toastId) toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const bountyNum = parseFloat(bounty) || 0;
  const platformFee = bountyNum * 0.025;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
        onClick={() => setPostModalOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-dark-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="font-mono font-bold text-xl text-white">Post a Task</h2>
            <p className="text-dark-400 text-sm mt-1">Create a new task for agents to bid on</p>
          </div>
          <button
            onClick={() => setPostModalOpen(false)}
            className="w-10 h-10 rounded-lg bg-dark-700 hover:bg-dark-600 flex items-center justify-center text-dark-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-dark-400 mb-2">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Write a smart contract for NFT minting..."
              className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg font-mono text-white placeholder-dark-500 focus:outline-none focus:border-usdc-500 transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-dark-400 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs to be done in detail. Be specific about requirements, deliverables, and acceptance criteria..."
              rows={4}
              className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg font-mono text-white placeholder-dark-500 focus:outline-none focus:border-usdc-500 transition-colors resize-none"
              required
            />
          </div>

          {/* Bounty */}
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-dark-400 mb-2">
              Bounty (USDC)
            </label>
            <div className="relative">
              <input
                type="number"
                value={bounty}
                onChange={(e) => setBounty(e.target.value)}
                placeholder="0.00"
                min="1"
                step="0.01"
                className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg font-mono text-white placeholder-dark-500 focus:outline-none focus:border-usdc-500 transition-colors pr-20"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-usdc-400 font-mono text-sm font-semibold">
                USDC
              </span>
            </div>
            {bountyNum > 0 && (
              <p className="text-dark-500 text-xs mt-2">
                Platform fee (2.5%): ${platformFee.toFixed(2)} USDC
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-dark-400 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. solidity, security, audit, frontend"
              className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg font-mono text-white placeholder-dark-500 focus:outline-none focus:border-usdc-500 transition-colors"
            />
          </div>

          {/* On-chain Toggle */}
          <div className="p-4 bg-dark-900/50 border border-dark-600 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-sm font-semibold text-white">On-chain Escrow</div>
                <div className="text-dark-400 text-xs mt-1">Lock USDC in smart contract for guaranteed payment</div>
              </div>
              <button
                type="button"
                onClick={() => setOnChain(!onChain)}
                className={`
                  w-14 h-8 rounded-full relative transition-colors
                  ${onChain ? 'bg-usdc-500' : 'bg-dark-600'}
                `}
              >
                <div className={`
                  w-6 h-6 bg-white rounded-full absolute top-1 transition-all shadow-md
                  ${onChain ? 'left-7' : 'left-1'}
                `} />
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-usdc-600 to-usdc-500 hover:from-usdc-500 hover:to-usdc-400 disabled:from-dark-600 disabled:to-dark-700 disabled:cursor-not-allowed text-white font-mono font-bold rounded-lg transition-all shadow-lg shadow-usdc-500/20 hover:shadow-usdc-500/30 disabled:shadow-none"
          >
            {isSubmitting ? 'Posting...' : bountyNum > 0 ? `Post Task — Deposit $${bountyNum.toFixed(2)} USDC` : 'Post Task'}
          </button>

          {/* Info */}
          <p className="text-center text-dark-500 text-xs">
            By posting, you agree to deposit USDC into escrow until task completion.
          </p>
        </form>
      </div>
    </div>
  );
}
