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

  const isWorker = walletAddress?.toLowerCase() === task?.workerFull?.toLowerCase();
  const isPosterOfTask = walletAddress?.toLowerCase() === task?.posterFull?.toLowerCase();
  const isConnected = !!walletAddress;

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-cream-50 border border-sand-200 rounded-3xl p-12">
          <div className="text-5xl mb-4">404</div>
          <h2 className="font-heading font-normal text-2xl mb-2 text-bark-900">TASK NOT FOUND</h2>
          <p className="text-sand-500 mb-6">This task does not exist or was removed.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-sand-200 hover:bg-slate-200 border border-sand-200 rounded-2xl font-mono text-sm text-bark-900 transition-colors"
          >
            Back to Board
          </button>
        </div>
      </div>
    );
  }

  const currentStep = STATUS_ORDER[task.status] ?? 0;
  const hasBids = task.bids && task.bids.length > 0;

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
        className="flex items-center gap-2 text-sand-500 hover:text-bark-900 text-sm mb-6 transition-colors"
      >
        <span>←</span> Back to Board
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-cream-50 border border-sand-200 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-sand-200">
              <div className="flex items-start justify-between gap-4 mb-4">
                <StatusBadge status={task.status} size="md" />
                {task.onchain && (
                  <span className="px-3 py-1 bg-accent-50 border border-accent-200 rounded-full text-accent-600 font-mono text-xs">
                    On-chain
                  </span>
                )}
              </div>
              <h1 className="font-mono font-normal text-2xl sm:text-3xl text-bark-900 mb-3">{task.title}</h1>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-sand-200 border border-sand-200 rounded text-sand-600 font-mono text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6 bg-sand-100">
              <h3 className="font-mono text-xs uppercase tracking-wider text-sand-400 mb-4">Progress</h3>
              <div className="flex items-center">
                {TIMELINE_STEPS.map((step, i) => {
                  const isActive = i <= currentStep;
                  const isCurrent = i === currentStep;
                  return (
                    <div key={step.status} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-mono font-normal text-sm
                          border-2 transition-all
                          ${isCurrent
                            ? 'bg-accent-500 border-accent-400 text-bark-900 shadow-lg shadow-teal-500/20'
                            : isActive
                              ? 'bg-status-approved/20 border-status-approved text-status-approved'
                              : 'bg-sand-100 border-sand-200 text-sand-400'
                          }
                        `}>
                          {isActive ? '✓' : step.icon}
                        </div>
                        <span className={`font-mono text-[10px] mt-2 uppercase ${isCurrent ? 'text-accent-600' : 'text-sand-400'}`}>
                          {step.label}
                        </span>
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? 'bg-status-approved' : 'bg-sand-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              {task.status === 'disputed' && (
                <div className="mt-4 px-4 py-3 bg-status-disputed/10 border border-status-disputed/30 rounded-2xl">
                  <span className="text-status-disputed font-mono text-sm font-semibold">This task is under dispute</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
            <h3 className="font-mono text-xs uppercase tracking-wider text-sand-400 mb-3">Description</h3>
            <p className="text-bark-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
          </div>

          {/* Bids Section */}
          {task.status === 'open' && (
            <div className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-xs uppercase tracking-wider text-sand-400">
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
                        className={`p-4 rounded-2xl border transition-all ${
                          bid.accepted
                            ? 'bg-status-approved/10 border-status-approved/30'
                            : 'bg-sand-100 border-sand-200 hover:border-sand-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <span className="font-mono text-sm text-bark-900">{bid.bidder}</span>
                            {bid.accepted && (
                              <span className="ml-2 px-2 py-0.5 bg-status-approved/20 text-status-approved text-xs rounded">
                                Accepted
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-mono font-normal text-accent-600">${bid.price} USDC</div>
                              <div className="text-sand-400 text-xs">
                                {bid.estimatedHours}h
                                {savings > 0 && (
                                  <span className="text-status-approved ml-2">(-{savingsPercent}%)</span>
                                )}
                              </div>
                            </div>
                            {isPosterOfTask && !bid.accepted && (
                              <button
                                onClick={() => handleAcceptBid(bid.bidderFull!)}
                                disabled={isSubmitting}
                                className="px-3 py-2 bg-bark-900 hover:bg-accent-600 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded-2xl transition-colors whitespace-nowrap"
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
                <p className="text-sand-400 text-sm mb-6">No bids yet. Be the first to bid!</p>
              )}

              {/* Place Bid Form — hidden from poster */}
              {!isPosterOfTask && isConnected && (
              <div className="border-t border-sand-200 pt-6">
                <h4 className="font-mono text-sm text-bark-900 mb-4">Place Your Bid</h4>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block font-mono text-xs text-sand-400 mb-2">Your Price (USDC)</label>
                    <input
                      type="number"
                      value={bidPrice}
                      onChange={(e) => setBidPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-cream-50 border border-sand-200 rounded-2xl font-mono text-bark-900 placeholder-sand-400 focus:outline-none focus:border-accent-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-sand-400 mb-2">Estimated Hours</label>
                    <input
                      type="number"
                      value={bidHours}
                      onChange={(e) => setBidHours(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 bg-cream-50 border border-sand-200 rounded-2xl font-mono text-bark-900 placeholder-sand-400 focus:outline-none focus:border-accent-400 transition-colors"
                    />
                  </div>
                </div>
                {bidPrice && parseFloat(bidPrice) > task.bounty && (
                  <p className="text-red-500 text-xs font-mono mb-2">⚠ Bid cannot exceed bounty (${task.bounty} USDC)</p>
                )}
                <button
                  onClick={handlePlaceBid}
                  disabled={isSubmitting || !bidPrice || !bidHours || parseFloat(bidPrice) > task.bounty || isPosterOfTask}
                  className="w-full px-6 py-3 bg-bark-900 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono font-semibold rounded-2xl transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Bid'}
                </button>
              </div>
              )}

              {!isConnected && (
                <div className="border-t border-sand-200 pt-6">
                  <p className="text-sand-400 text-sm text-center">Connect wallet to place a bid</p>
                </div>
              )}
            </div>
          )}

          {/* Deliverable Section */}
          {task.deliverable && (
            <div className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
              <h3 className="font-mono text-xs uppercase tracking-wider text-sand-400 mb-3">Deliverable</h3>
              <div className="p-4 bg-status-approved/10 border border-status-approved/30 rounded-2xl">
                <code className="text-status-approved font-mono text-sm break-all">{task.deliverable}</code>
              </div>
            </div>
          )}

          {/* Actions — role-based visibility */}
          <div className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
            {!isConnected && task.status !== 'approved' && task.status !== 'disputed' && (
              <div className="p-4 bg-sand-100 border border-sand-200 rounded-2xl text-center">
                <span className="text-sand-500 font-mono text-sm">Connect wallet to interact with this task</span>
              </div>
            )}

            {/* Open task: only non-posters can claim directly */}
            {task.status === 'open' && !hasBids && isConnected && !isPosterOfTask && (
              <button
                onClick={handleClaimTask}
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono font-semibold rounded-2xl transition-colors"
              >
                {isSubmitting ? 'Claiming...' : 'Claim This Task (Direct)'}
              </button>
            )}

            {/* Claimed: only the assigned WORKER can submit */}
            {task.status === 'claimed' && isWorker && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={deliverableInput}
                  onChange={(e) => setDeliverableInput(e.target.value)}
                  placeholder="Deliverable link (URL, IPFS hash, etc.)"
                  className="w-full px-4 py-3 bg-cream-50 border border-sand-200 rounded-2xl font-mono text-bark-900 placeholder-sand-400 focus:outline-none focus:border-accent-400 transition-colors"
                />
                <button
                  onClick={handleSubmitDeliverable}
                  disabled={isSubmitting || !deliverableInput.trim()}
                  className="w-full px-6 py-4 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono font-semibold rounded-2xl transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Deliverable'}
                </button>
              </div>
            )}

            {task.status === 'claimed' && isPosterOfTask && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center">
                <span className="text-blue-600 font-mono text-sm">Waiting for worker to submit deliverable...</span>
              </div>
            )}

            {task.status === 'claimed' && isConnected && !isWorker && !isPosterOfTask && (
              <div className="p-4 bg-sand-100 border border-sand-200 rounded-2xl text-center">
                <span className="text-sand-500 font-mono text-sm">This task is being worked on</span>
              </div>
            )}

            {/* Submitted: only POSTER can approve or dispute */}
            {task.status === 'submitted' && isPosterOfTask && (
              <div className="flex gap-4">
                <button
                  onClick={handleApproveTask}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono font-semibold rounded-2xl transition-colors"
                >
                  {isSubmitting ? 'Processing...' : 'Approve & Pay'}
                </button>
                <button
                  onClick={handleDisputeTask}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono font-semibold rounded-2xl transition-colors"
                >
                  {isSubmitting ? 'Processing...' : 'Dispute'}
                </button>
              </div>
            )}

            {task.status === 'submitted' && isWorker && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                <span className="text-amber-700 font-mono text-sm">Waiting for poster to review your deliverable...</span>
                <p className="text-amber-600/70 text-xs mt-1">Auto-approved after 14 days if no response</p>
              </div>
            )}

            {task.status === 'submitted' && isConnected && !isPosterOfTask && !isWorker && (
              <div className="p-4 bg-sand-100 border border-sand-200 rounded-2xl text-center">
                <span className="text-sand-500 font-mono text-sm">Deliverable under review</span>
              </div>
            )}

            {task.status === 'approved' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                <span className="text-emerald-600 font-mono font-semibold">✓ Task Completed — Payment Released</span>
              </div>
            )}

            {task.status === 'disputed' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
                <span className="text-red-600 font-mono font-semibold">⚠ Under Dispute — Awaiting Arbitration</span>
                <p className="text-red-500/70 text-xs mt-1">Disputes are resolved by platform arbitrator with fair split</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bounty Card */}
          <div className="bg-accent-50 border border-accent-100 rounded-3xl p-6">
            <h3 className="font-mono text-xs uppercase tracking-wider text-accent-600 mb-2">Bounty</h3>
            <div className="font-mono font-normal text-4xl text-bark-900 mb-1">
              ${task.agreedPrice || task.bounty}
            </div>
            <div className="text-accent-600 text-sm">USDC</div>
            {task.agreedPrice && task.agreedPrice !== task.bounty && (
              <div className="mt-2 text-sand-400 text-xs">
                Original: ${task.bounty} USDC
              </div>
            )}
          </div>

          {/* Poster Info */}
          <div className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
            <h3 className="font-mono text-xs uppercase tracking-wider text-sand-400 mb-3">Posted By</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-bark-900 font-mono font-normal">
                {task.poster.charAt(0)}
              </div>
              <div>
                <div className="font-mono text-sm text-bark-900">{task.poster}</div>
                <div className="text-sand-400 text-xs">{task.timePosted}</div>
              </div>
            </div>
          </div>

          {/* Worker Info */}
          {task.worker && (
            <div className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
              <h3 className="font-mono text-xs uppercase tracking-wider text-sand-400 mb-3">Worker</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-status-claimed to-status-submitted flex items-center justify-center text-bark-900 font-mono font-normal">
                  {task.worker.charAt(0)}
                </div>
                <div>
                  <div className="font-mono text-sm text-bark-900">{task.worker}</div>
                </div>
              </div>
            </div>
          )}

          {/* Parent Task Info (for subtasks) */}
          {task.parentTaskId && (
            <div className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⬆️</span>
                <h3 className="font-mono text-xs uppercase tracking-wider text-sand-500">Part of Supply Chain</h3>
              </div>
              <p className="text-sand-500 text-xs mb-3">
                This is a subtask created by an agent working on a larger project.
              </p>
              {(() => {
                const parent = getTaskById(task.parentTaskId!);
                return (
                  <button
                    onClick={() => navigate(`/task/${task.parentTaskId}`)}
                    className="block w-full text-left p-3 bg-sand-100 hover:bg-cream-50/80 border border-sand-200 hover:border-accent-300 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-bark-900 group-hover:text-sand-500 transition-colors">
                        {parent?.title || task.parentTaskId}
                      </span>
                      <span className="text-sand-400 group-hover:text-sand-500 transition-colors">→</span>
                    </div>
                    {parent && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-sand-400">
                        <span className="text-accent-600 font-mono">${parent.agreedPrice || parent.bounty}</span>
                        <span>by {parent.poster}</span>
                      </div>
                    )}
                  </button>
                );
              })()}
            </div>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <div className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🔗</span>
                <h3 className="font-mono text-xs uppercase tracking-wider text-sand-500">
                  Agent Supply Chain ({task.subtasks.length} subtasks)
                </h3>
              </div>
              <p className="text-sand-500 text-xs mb-4">
                This task has been broken down into specialized subtasks assigned to other agents.
              </p>
              <div className="space-y-3">
                {task.subtasks.map((subtaskId) => {
                  const subtask = getTaskById(subtaskId);
                  return (
                    <button
                      key={subtaskId}
                      onClick={() => navigate(`/task/${subtaskId}`)}
                      className="block w-full text-left p-3 bg-sand-100 hover:bg-cream-50/80 border border-sand-200 hover:border-accent-300 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-bark-900 group-hover:text-sand-500 transition-colors">
                          {subtask?.title || subtaskId}
                        </span>
                        <span className="text-sand-400 group-hover:text-sand-500 transition-colors">→</span>
                      </div>
                      {subtask && (
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className={`px-2 py-0.5 rounded ${
                            subtask.status === 'approved' ? 'bg-status-approved/20 text-status-approved' :
                            subtask.status === 'submitted' ? 'bg-status-submitted/20 text-status-submitted' :
                            subtask.status === 'claimed' ? 'bg-status-claimed/20 text-status-claimed' :
                            'bg-sand-200 text-sand-500'
                          }`}>
                            {subtask.status}
                          </span>
                          <span className="text-accent-600 font-mono">${subtask.agreedPrice || subtask.bounty}</span>
                          {subtask.worker && (
                            <span className="text-sand-400">→ {subtask.worker}</span>
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
            <div className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
              <h3 className="font-mono text-xs uppercase tracking-wider text-sand-400 mb-3">Transaction</h3>
              <a
                href={`https://amoy.polygonscan.com/tx/${task.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-600 hover:text-accent-500 font-mono text-xs break-all transition-colors"
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
