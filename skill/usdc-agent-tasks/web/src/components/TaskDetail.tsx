import { useParams, useNavigate } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { useWallet } from '../hooks/useWallet';
import StatusBadge from './StatusBadge';
import type { TaskStatus, Bid } from '../lib/types';
import { useState } from 'react';
import { toast } from './Toast';

const TIMELINE_STEPS: { status: TaskStatus; label: string; icon: string }[] = [
  { status: 'open', label: 'Open', icon: '1' },
  { status: 'claimed', label: 'Claimed', icon: '2' },
  { status: 'submitted', label: 'Submitted', icon: '3' },
  { status: 'approved', label: 'Approved', icon: '4' },
];

const STATUS_ORDER: Record<string, number> = {
  open: 0,
  claimed: 1,
  submitted: 2,
  approved: 3,
  disputed: 2,
};

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTaskById, claimTask, submitDeliverable, approveTask, disputeTask, placeBid, acceptBid } = useTasks();
  const { address: walletAddress } = useWallet();
  const [deliverableInput, setDeliverableInput] = useState('');
  const [bidPrice, setBidPrice] = useState('');
  const [bidHours, setBidHours] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const task = id ? getTaskById(id) : undefined;

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-slate-100 rounded-xl p-12">
          <div className="text-5xl mb-4">404</div>
          <h2 className="font-heading font-bold text-2xl mb-2 text-slate-900">TASK NOT FOUND</h2>
          <p className="text-slate-500 mb-6">This task does not exist or was removed.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg font-mono text-sm text-slate-900 transition-colors"
          >
            Back to Board
          </button>
        </div>
      </div>
    );
  }

  const currentStep = STATUS_ORDER[task.status] ?? 0;
  const hasBids = task.bids && task.bids.length > 0;
  const isPoster = walletAddress?.toLowerCase() === task.posterFull?.toLowerCase();

  const handlePlaceBid = async () => {
    if (!bidPrice || !bidHours) return;
    setIsSubmitting(true);
    const useOnChain = task.onchain || false;
    const toastId = useOnChain ? toast.loading('Submitting bid on-chain...') : null;

    try {
      await placeBid(task.id, parseFloat(bidPrice), parseInt(bidHours, 10), useOnChain);
      if (toastId) toast.dismiss(toastId);
      toast.success('Bid submitted!');
      setBidPrice('');
      setBidHours('');
    } catch (err) {
      if (toastId) toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : 'Failed to submit bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptBid = async (bidderAddress: string) => {
    setIsSubmitting(true);
    const useOnChain = task.onchain || false;
    const toastId = useOnChain ? toast.loading('Accepting bid on-chain...') : null;

    try {
      await acceptBid(task.id, bidderAddress, useOnChain);
      if (toastId) toast.dismiss(toastId);
      toast.success('Bid accepted! Worker assigned.');
    } catch (err) {
      if (toastId) toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : 'Failed to accept bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimTask = async () => {
    setIsSubmitting(true);
    const useOnChain = task.onchain || false;
    const toastId = useOnChain ? toast.loading('Claiming task on-chain...') : null;

    try {
      await claimTask(task.id, useOnChain);
      if (toastId) toast.dismiss(toastId);
      toast.success('Task claimed!');
    } catch (err) {
      if (toastId) toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : 'Failed to claim task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDeliverable = async () => {
    if (!deliverableInput.trim()) return;
    setIsSubmitting(true);
    const useOnChain = task.onchain || false;
    const toastId = useOnChain ? toast.loading('Submitting deliverable on-chain...') : null;

    try {
      await submitDeliverable(task.id, deliverableInput, useOnChain);
      if (toastId) toast.dismiss(toastId);
      toast.success('Deliverable submitted!');
      setDeliverableInput('');
    } catch (err) {
      if (toastId) toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : 'Failed to submit deliverable');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveTask = async () => {
    setIsSubmitting(true);
    const useOnChain = task.onchain || false;
    const toastId = useOnChain ? toast.loading('Approving and releasing payment...') : null;

    try {
      await approveTask(task.id, useOnChain);
      if (toastId) toast.dismiss(toastId);
      toast.success('Task approved! Payment released.');
    } catch (err) {
      if (toastId) toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : 'Failed to approve task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisputeTask = async () => {
    setIsSubmitting(true);
    const useOnChain = task.onchain || false;
    const toastId = useOnChain ? toast.loading('Filing dispute on-chain...') : null;

    try {
      await disputeTask(task.id, useOnChain);
      if (toastId) toast.dismiss(toastId);
      toast.info('Dispute filed.');
    } catch (err) {
      if (toastId) toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : 'Failed to file dispute');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm mb-6 transition-colors"
      >
        <span>←</span> Back to Board
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-start justify-between gap-4 mb-4">
                <StatusBadge status={task.status} size="md" />
                {task.onchain && (
                  <span className="px-3 py-1 bg-teal-50 border border-teal-200 rounded-full text-teal-600 font-mono text-xs">
                    On-chain
                  </span>
                )}
              </div>
              <h1 className="font-mono font-bold text-2xl sm:text-3xl text-slate-900 mb-3">{task.title}</h1>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6 bg-slate-50">
              <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-4">Progress</h3>
              <div className="flex items-center">
                {TIMELINE_STEPS.map((step, i) => {
                  const isActive = i <= currentStep;
                  const isCurrent = i === currentStep;
                  return (
                    <div key={step.status} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm
                          border-2 transition-all
                          ${isCurrent
                            ? 'bg-teal-500 border-teal-400 text-slate-900 shadow-lg shadow-teal-500/20'
                            : isActive
                              ? 'bg-status-approved/20 border-status-approved text-status-approved'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }
                        `}>
                          {isActive ? '✓' : step.icon}
                        </div>
                        <span className={`font-mono text-[10px] mt-2 uppercase ${isCurrent ? 'text-teal-600' : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? 'bg-status-approved' : 'bg-slate-100'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              {task.status === 'disputed' && (
                <div className="mt-4 px-4 py-3 bg-status-disputed/10 border border-status-disputed/30 rounded-lg">
                  <span className="text-status-disputed font-mono text-sm font-semibold">This task is under dispute</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-slate-100 rounded-xl p-6">
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-3">Description</h3>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
          </div>

          {/* Bids Section */}
          {task.status === 'open' && (
            <div className="bg-white border border-slate-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400">
                  Bids ({task.bidCount || task.bids?.length || 0})
                </h3>
              </div>

              {hasBids ? (
                <div className="space-y-3 mb-6">
                  {task.bids!.map((bid: Bid, i: number) => {
                    const savings = task.bounty - bid.price;
                    const savingsPercent = ((savings / task.bounty) * 100).toFixed(0);
                    return (
                      <div
                        key={i}
                        className={`p-4 rounded-lg border transition-all ${
                          bid.accepted
                            ? 'bg-status-approved/10 border-status-approved/30'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <span className="font-mono text-sm text-slate-900">{bid.bidder}</span>
                            {bid.accepted && (
                              <span className="ml-2 px-2 py-0.5 bg-status-approved/20 text-status-approved text-xs rounded">
                                Accepted
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-mono font-bold text-teal-600">${bid.price} USDC</div>
                              <div className="text-slate-400 text-xs">
                                {bid.estimatedHours}h
                                {savings > 0 && (
                                  <span className="text-status-approved ml-2">(-{savingsPercent}%)</span>
                                )}
                              </div>
                            </div>
                            {isPoster && !bid.accepted && (
                              <button
                                onClick={() => handleAcceptBid(bid.bidderFull!)}
                                disabled={isSubmitting}
                                className="px-3 py-2 bg-slate-900 hover:bg-teal-500 disabled:opacity-50 text-slate-900 font-mono text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                              >
                                Accept Bid
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-400 text-sm mb-6">No bids yet. Be the first to bid!</p>
              )}

              {/* Place Bid Form */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="font-mono text-sm text-slate-900 mb-4">Place Your Bid</h4>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-mono text-xs text-slate-400 mb-2">Your Price (USDC)</label>
                    <input
                      type="number"
                      value={bidPrice}
                      onChange={(e) => setBidPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-slate-400 mb-2">Estimated Hours</label>
                    <input
                      type="number"
                      value={bidHours}
                      onChange={(e) => setBidHours(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-400 transition-colors"
                    />
                  </div>
                </div>
                <button
                  onClick={handlePlaceBid}
                  disabled={isSubmitting || !bidPrice || !bidHours}
                  className="w-full px-6 py-3 bg-slate-900 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-mono font-semibold rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Bid'}
                </button>
              </div>
            </div>
          )}

          {/* Deliverable Section */}
          {task.deliverable && (
            <div className="bg-white border border-slate-100 rounded-xl p-6">
              <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-3">Deliverable</h3>
              <div className="p-4 bg-status-approved/10 border border-status-approved/30 rounded-lg">
                <code className="text-status-approved font-mono text-sm break-all">{task.deliverable}</code>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white border border-slate-100 rounded-xl p-6">
            {task.status === 'open' && !hasBids && (
              <button
                onClick={handleClaimTask}
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-status-claimed hover:bg-status-claimed/80 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-mono font-semibold rounded-lg transition-colors"
              >
                {isSubmitting ? 'Claiming...' : 'Claim This Task (Direct)'}
              </button>
            )}

            {task.status === 'claimed' && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={deliverableInput}
                  onChange={(e) => setDeliverableInput(e.target.value)}
                  placeholder="Deliverable link (URL, IPFS hash, etc.)"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-400 transition-colors"
                />
                <button
                  onClick={handleSubmitDeliverable}
                  disabled={isSubmitting || !deliverableInput.trim()}
                  className="w-full px-6 py-4 bg-status-submitted hover:bg-status-submitted/80 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-mono font-semibold rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Deliverable'}
                </button>
              </div>
            )}

            {task.status === 'submitted' && (
              <div className="flex gap-4">
                <button
                  onClick={handleApproveTask}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-status-approved hover:bg-status-approved/80 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-mono font-semibold rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Processing...' : 'Approve & Pay'}
                </button>
                <button
                  onClick={handleDisputeTask}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-status-disputed hover:bg-status-disputed/80 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-mono font-semibold rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Processing...' : 'Dispute'}
                </button>
              </div>
            )}

            {task.status === 'approved' && (
              <div className="p-4 bg-status-approved/10 border border-status-approved/30 rounded-lg text-center">
                <span className="text-status-approved font-mono font-semibold">Task Completed - Payment Released</span>
              </div>
            )}

            {task.status === 'disputed' && (
              <div className="p-4 bg-status-disputed/10 border border-status-disputed/30 rounded-lg text-center">
                <span className="text-status-disputed font-mono font-semibold">Under Dispute - Awaiting Resolution</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bounty Card */}
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-6">
            <h3 className="font-mono text-xs uppercase tracking-wider text-teal-600 mb-2">Bounty</h3>
            <div className="font-mono font-bold text-4xl text-slate-900 mb-1">
              ${task.agreedPrice || task.bounty}
            </div>
            <div className="text-teal-600 text-sm">USDC</div>
            {task.agreedPrice && task.agreedPrice !== task.bounty && (
              <div className="mt-2 text-slate-400 text-xs">
                Original: ${task.bounty} USDC
              </div>
            )}
          </div>

          {/* Poster Info */}
          <div className="bg-white border border-slate-100 rounded-xl p-6">
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-3">Posted By</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-slate-900 font-mono font-bold">
                {task.poster.charAt(0)}
              </div>
              <div>
                <div className="font-mono text-sm text-slate-900">{task.poster}</div>
                <div className="text-slate-400 text-xs">{task.timePosted}</div>
              </div>
            </div>
          </div>

          {/* Worker Info */}
          {task.worker && (
            <div className="bg-white border border-slate-100 rounded-xl p-6">
              <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-3">Worker</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-status-claimed to-status-submitted flex items-center justify-center text-slate-900 font-mono font-bold">
                  {task.worker.charAt(0)}
                </div>
                <div>
                  <div className="font-mono text-sm text-slate-900">{task.worker}</div>
                </div>
              </div>
            </div>
          )}

          {/* Parent Task Info (for subtasks) */}
          {task.parentTaskId && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⬆️</span>
                <h3 className="font-mono text-xs uppercase tracking-wider text-slate-500">Part of Supply Chain</h3>
              </div>
              <p className="text-slate-500 text-xs mb-3">
                This is a subtask created by an agent working on a larger project.
              </p>
              {(() => {
                const parent = getTaskById(task.parentTaskId!);
                return (
                  <button
                    onClick={() => navigate(`/task/${task.parentTaskId}`)}
                    className="block w-full text-left p-3 bg-slate-50 hover:bg-white/80 border border-slate-200 hover:border-teal-300 rounded-lg transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-slate-900 group-hover:text-slate-500 transition-colors">
                        {parent?.title || task.parentTaskId}
                      </span>
                      <span className="text-slate-400 group-hover:text-slate-500 transition-colors">→</span>
                    </div>
                    {parent && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <span className="text-teal-600 font-mono">${parent.agreedPrice || parent.bounty}</span>
                        <span>by {parent.poster}</span>
                      </div>
                    )}
                  </button>
                );
              })()}
            </div>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🔗</span>
                <h3 className="font-mono text-xs uppercase tracking-wider text-slate-500">
                  Agent Supply Chain ({task.subtasks.length} subtasks)
                </h3>
              </div>
              <p className="text-slate-500 text-xs mb-4">
                This task has been broken down into specialized subtasks assigned to other agents.
              </p>
              <div className="space-y-3">
                {task.subtasks.map((subtaskId) => {
                  const subtask = getTaskById(subtaskId);
                  return (
                    <button
                      key={subtaskId}
                      onClick={() => navigate(`/task/${subtaskId}`)}
                      className="block w-full text-left p-3 bg-slate-50 hover:bg-white/80 border border-slate-200 hover:border-teal-300 rounded-lg transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-slate-900 group-hover:text-slate-500 transition-colors">
                          {subtask?.title || subtaskId}
                        </span>
                        <span className="text-slate-400 group-hover:text-slate-500 transition-colors">→</span>
                      </div>
                      {subtask && (
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className={`px-2 py-0.5 rounded ${
                            subtask.status === 'approved' ? 'bg-status-approved/20 text-status-approved' :
                            subtask.status === 'submitted' ? 'bg-status-submitted/20 text-status-submitted' :
                            subtask.status === 'claimed' ? 'bg-status-claimed/20 text-status-claimed' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {subtask.status}
                          </span>
                          <span className="text-teal-600 font-mono">${subtask.agreedPrice || subtask.bounty}</span>
                          {subtask.worker && (
                            <span className="text-slate-400">→ {subtask.worker}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transaction Info */}
          {task.txHash && (
            <div className="bg-white border border-slate-100 rounded-xl p-6">
              <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-3">Transaction</h3>
              <a
                href={`https://amoy.polygonscan.com/tx/${task.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 hover:text-teal-500 font-mono text-xs break-all transition-colors"
              >
                {task.txHash.slice(0, 10)}...{task.txHash.slice(-8)} ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
