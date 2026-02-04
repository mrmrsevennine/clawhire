import { useState } from 'react';
import { useStore } from '../store';
import { useTasks } from '../hooks/useTasks';

export function PostTaskModal() {
  const postModalOpen = useStore((s) => s.postModalOpen);
  const setPostModalOpen = useStore((s) => s.setPostModalOpen);
  const { createTask } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bounty, setBounty] = useState('');
  const [tags, setTags] = useState('');
  const [onChain, setOnChain] = useState(false);

  if (!postModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !bounty) return;
    createTask({
      title: title.trim(),
      description: description.trim(),
      bounty: parseFloat(bounty),
      tags: tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
    });
    setTitle('');
    setDescription('');
    setBounty('');
    setTags('');
    setOnChain(false);
    setPostModalOpen(false);
  };

  const bountyNum = parseFloat(bounty) || 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={() => setPostModalOpen(false)} />
      <div className="relative w-full max-w-lg border-3 border-black bg-[#F5F0E8] shadow-brutal-xl max-h-[90vh] overflow-y-auto">
        <div className="border-b-3 border-black bg-brutal-pink p-6 flex items-center justify-between">
          <h2 className="font-mono font-bold text-2xl">POST A TASK</h2>
          <button onClick={() => setPostModalOpen(false)} className="w-10 h-10 border-3 border-black bg-white font-mono font-bold text-xl flex items-center justify-center hover:bg-brutal-yellow transition-colors shadow-brutal hover:shadow-brutal-lg hover:-translate-y-0.5">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="font-mono text-xs font-bold uppercase tracking-wider block mb-2">Task Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Write a smart contract..." className="brutal-input w-full" required />
          </div>
          <div>
            <label className="font-mono text-xs font-bold uppercase tracking-wider block mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs to be done? Be specific..." rows={4} className="brutal-input w-full resize-none" required />
          </div>
          <div>
            <label className="font-mono text-xs font-bold uppercase tracking-wider block mb-2">Bounty (USDC)</label>
            <div className="relative">
              <input type="number" value={bounty} onChange={(e) => setBounty(e.target.value)} placeholder="0.00" min="1" step="0.01" className="brutal-input w-full pr-20" required />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-bold text-sm opacity-60">USDC</span>
            </div>
          </div>
          <div>
            <label className="font-mono text-xs font-bold uppercase tracking-wider block mb-2">Tags (comma-separated)</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. solidity, security, frontend" className="brutal-input w-full" />
          </div>
          <div className="border-3 border-black bg-white p-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-sm font-bold">ON-CHAIN ESCROW</div>
              <div className="font-sans text-xs opacity-60">Lock USDC in smart contract</div>
            </div>
            <button type="button" onClick={() => setOnChain(!onChain)} className={'w-14 h-8 border-3 border-black relative transition-colors ' + (onChain ? 'bg-brutal-green' : 'bg-gray-300')}>
              <div className={'w-5 h-5 bg-white border-[2px] border-black absolute top-0.5 transition-all ' + (onChain ? 'left-6' : 'left-0.5')} />
            </button>
          </div>
          <button type="submit" className="brutal-btn bg-black text-white w-full text-center py-4 text-base hover:bg-brutal-green hover:text-black">
            {bountyNum > 0 ? 'POST TASK — PAY $' + bountyNum.toFixed(2) + ' USDC' : 'POST TASK'}
          </button>
        </form>
      </div>
    </div>
  );
}
