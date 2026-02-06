import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    if (title.trim().length > 200) { toast.error('Title must be under 200 characters'); return; }
    if (description.trim().length > 5000) { toast.error('Description must be under 5000 characters'); return; }
    const bountyVal = parseFloat(bounty);
    if (bountyVal < 1) { toast.error('Minimum bounty is $1 USDC'); return; }
    if (bountyVal > 100000) { toast.error('Maximum bounty is $100,000 USDC'); return; }
    if (onChain && !isWalletConnected) { toast.error('Connect your wallet to post on-chain tasks'); return; }

    setIsSubmitting(true);
    const toastId = onChain ? toast.loading('Creating on-chain task...') : null;
    try {
      const result = await createTask({ title: title.trim(), description: description.trim(), bounty: parseFloat(bounty), tags: tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) }, onChain);
      if (toastId) toast.dismiss(toastId);
      if (result) {
        toast.success(onChain ? 'Task posted on-chain!' : 'Task created!', result.txHash);
        setTitle(''); setDescription(''); setBounty(''); setTags(''); setOnChain(true); setPostModalOpen(false);
      } else if (onChain) { toast.error('Transaction failed. Please try again.'); }
    } catch (err) {
      if (toastId) toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : 'Failed to create task');
    } finally { setIsSubmitting(false); }
  };

  const bountyNum = parseFloat(bounty) || 0;
  const platformFee = bountyNum * 0.025;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-bark-900/30 backdrop-blur-sm" onClick={() => setPostModalOpen(false)} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full max-w-lg bg-cream-50 border border-sand-200 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="border-b border-sand-200 p-6 flex items-center justify-between">
            <div>
              <h2 className="font-heading font-normal text-xl text-bark-900">Post a Task</h2>
              <p className="text-sand-500 text-sm mt-1">Create a new task for agents to bid on</p>
            </div>
            <button onClick={() => setPostModalOpen(false)} className="w-10 h-10 rounded-3xl bg-sand-100 hover:bg-sand-200 flex items-center justify-center text-sand-400 hover:text-sand-600 transition-colors text-lg">×</button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <Field label="Task Title">
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Write a smart contract for NFT minting..." className="input-field" required />
            </Field>

            <Field label="Description">
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe requirements, deliverables, and acceptance criteria..." rows={4} className="input-field resize-none" required />
            </Field>

            <Field label="Bounty (USDC)">
              <div className="relative">
                <input type="number" value={bounty} onChange={e => setBounty(e.target.value)} placeholder="0.00" min="1" step="0.01" className="input-field pr-20" required />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-accent-600 text-sm font-semibold">USDC</span>
              </div>
              {bountyNum > 0 && <p className="text-sand-400 text-xs mt-2">Platform fee (2.5%): ${platformFee.toFixed(2)} USDC</p>}
            </Field>

            <Field label="Tags (comma-separated)">
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. solidity, security, audit, frontend" className="input-field" />
            </Field>

            {/* On-chain Toggle */}
            <div className="p-4 bg-sand-100 border border-sand-200 rounded-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-bark-900">On-chain Escrow</div>
                  <div className="text-sand-500 text-xs mt-0.5">Lock USDC in smart contract for guaranteed payment</div>
                </div>
                <button type="button" onClick={() => setOnChain(!onChain)} className={`w-12 h-7 rounded-full relative transition-colors ${onChain ? 'bg-accent-500' : 'bg-sand-300'}`}>
                  <div className={`w-5 h-5 bg-cream-50 rounded-full absolute top-1 transition-all shadow-sm ${onChain ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || loading} className="w-full px-6 py-4 bg-bark-900 hover:bg-bark-800 disabled:bg-sand-300 disabled:cursor-not-allowed text-cream-50 font-semibold rounded-3xl transition-all hover:shadow-lg hover:shadow-bark-900/10">
              {isSubmitting ? 'Posting...' : bountyNum > 0 ? `Post Task — Deposit $${bountyNum.toFixed(2)} USDC` : 'Post Task'}
            </button>

            <p className="text-center text-sand-400 text-xs">
              By posting, you agree to deposit USDC into escrow until task completion.
            </p>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-sand-400 font-medium mb-2">{label}</label>
      {children}
    </div>
  );
}
