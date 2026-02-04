import { useParams, useNavigate } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { useStore } from '../store';
import StatusBadge from './StatusBadge';
import type { TaskStatus } from '../lib/types';
import { useState } from 'react';

const TIMELINE_STEPS: { status: TaskStatus; label: string }[] = [
  { status: 'open', label: 'Open' },
  { status: 'claimed', label: 'Claimed' },
  { status: 'submitted', label: 'Submitted' },
  { status: 'approved', label: 'Approved' },
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
  const { getTaskById, claimTask, submitDeliverable, approveTask, disputeTask } = useTasks();
  const [deliverableInput, setDeliverableInput] = useState('');

  const task = id ? getTaskById(id) : undefined;

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="border-3 border-black bg-white shadow-brutal p-12">
          <div className="text-5xl mb-4">😵</div>
          <h2 className="font-mono font-bold text-2xl mb-2">TASK NOT FOUND</h2>
          <p className="font-sans opacity-60 mb-6">This task does not exist or was removed.</p>
          <button onClick={() => navigate('/')} className="brutal-btn bg-brutal-yellow text-black">← BACK TO BOARD</button>
        </div>
      </div>
    );
  }

  const currentStep = STATUS_ORDER[task.status] ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate('/')} className="brutal-btn bg-white text-black mb-6 text-xs">← BACK TO BOARD</button>

      <div className="border-3 border-black bg-white shadow-brutal-lg">
        {/* Header */}
        <div className="border-b-3 border-black bg-brutal-yellow p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <StatusBadge status={task.status} size="md" />
              <h1 className="font-mono font-bold text-3xl sm:text-4xl mt-3">{task.title}</h1>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-4xl sm:text-5xl">${task.bounty}</div>
              <div className="font-mono text-sm font-bold opacity-60">USDC</div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="border-b-3 border-black p-6 sm:p-8 bg-[#FAFAF5]">
          <h3 className="font-mono font-bold text-sm uppercase tracking-wider mb-4 opacity-60">Progress</h3>
          <div className="flex items-center gap-0">
            {TIMELINE_STEPS.map((step, i) => {
              const isActive = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={step.status} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={'w-8 h-8 border-3 border-black flex items-center justify-center font-mono font-bold text-xs ' + (isCurrent ? 'bg-brutal-green shadow-brutal animate-dot-glow' : isActive ? 'bg-brutal-blue' : 'bg-gray-200')}>
                      {isActive ? '✓' : i + 1}
                    </div>
                    <span className={'font-mono text-[10px] font-bold mt-2 uppercase ' + (isCurrent ? 'text-black' : 'opacity-40')}>
                      {step.label}
                    </span>
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div className={'flex-1 h-[3px] mx-2 ' + (i < currentStep ? 'bg-black' : 'bg-gray-300')} />
                  )}
                </div>
              );
            })}
          </div>
          {task.status === 'disputed' && (
            <div className="mt-4 border-3 border-black bg-brutal-pink px-4 py-2 font-mono text-sm font-bold">
              ⚠️ THIS TASK IS DISPUTED
            </div>
          )}
        </div>

        {/* Description */}
        <div className="border-b-3 border-black p-6 sm:p-8">
          <h3 className="font-mono font-bold text-sm uppercase tracking-wider mb-3 opacity-60">Description</h3>
          <p className="font-sans text-base leading-relaxed">{task.description}</p>
        </div>

        {/* Tags */}
        <div className="border-b-3 border-black p-6 sm:p-8">
          <h3 className="font-mono font-bold text-sm uppercase tracking-wider mb-3 opacity-60">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {task.tags.map((tag) => (
              <span key={tag} className="bg-brutal-purple border-[2px] border-black px-3 py-1 font-mono text-xs font-bold uppercase">{tag}</span>
            ))}
          </div>
        </div>

        {/* Poster & Worker */}
        <div className="border-b-3 border-black p-6 sm:p-8 grid sm:grid-cols-2 gap-6">
          <div>
            <h3 className="font-mono font-bold text-sm uppercase tracking-wider mb-2 opacity-60">Posted by</h3>
            <div className="border-3 border-black bg-brutal-orange px-4 py-3 font-mono text-sm font-bold shadow-brutal">{task.poster}</div>
            <div className="font-mono text-xs opacity-50 mt-2">{task.timePosted}</div>
          </div>
          {task.worker && (
            <div>
              <h3 className="font-mono font-bold text-sm uppercase tracking-wider mb-2 opacity-60">Worker</h3>
              <div className="border-3 border-black bg-brutal-blue px-4 py-3 font-mono text-sm font-bold shadow-brutal">{task.worker}</div>
            </div>
          )}
        </div>

        {/* Deliverable */}
        {task.deliverable && (
          <div className="border-b-3 border-black p-6 sm:p-8">
            <h3 className="font-mono font-bold text-sm uppercase tracking-wider mb-3 opacity-60">Deliverable</h3>
            <div className="border-3 border-black bg-brutal-green px-4 py-3 font-mono text-sm break-all shadow-brutal">📦 {task.deliverable}</div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 sm:p-8 flex flex-wrap gap-3">
          {task.status === 'open' && (
            <button onClick={() => claimTask(task.id)} className="brutal-btn bg-brutal-green text-black">🙋 CLAIM THIS TASK</button>
          )}
          {task.status === 'claimed' && (
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <input type="text" value={deliverableInput} onChange={(e) => setDeliverableInput(e.target.value)} placeholder="Deliverable link (URL, IPFS, etc.)" className="brutal-input flex-1" />
              <button onClick={() => { if (deliverableInput.trim()) { submitDeliverable(task.id, deliverableInput); setDeliverableInput(''); } }} className="brutal-btn bg-brutal-blue text-black">📤 SUBMIT DELIVERABLE</button>
            </div>
          )}
          {task.status === 'submitted' && (
            <>
              <button onClick={() => approveTask(task.id)} className="brutal-btn bg-brutal-green text-black">✅ APPROVE & PAY</button>
              <button onClick={() => disputeTask(task.id)} className="brutal-btn bg-brutal-pink text-black">⚠️ DISPUTE</button>
            </>
          )}
          {task.status === 'approved' && (
            <div className="border-3 border-black bg-brutal-green px-6 py-4 font-mono font-bold shadow-brutal w-full text-center">✅ TASK COMPLETED — PAYMENT RELEASED</div>
          )}
          {task.status === 'disputed' && (
            <div className="border-3 border-black bg-brutal-pink px-6 py-4 font-mono font-bold shadow-brutal w-full text-center">⚠️ UNDER DISPUTE — AWAITING RESOLUTION</div>
          )}
        </div>
      </div>
    </div>
  );
}
