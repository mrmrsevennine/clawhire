import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Task } from '../lib/types';
import StatusBadge from './StatusBadge';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const navigate = useNavigate();
  const hasBids = (task.bidCount || 0) > 0;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      onClick={() => navigate('/task/' + task.id)}
      className="group glass-card p-6 cursor-pointer flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={task.status} />
        <span className="text-slate-400 text-xs shrink-0">{task.timePosted}</span>
      </div>

      {/* Title */}
      <h3 className="font-heading font-semibold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
        {task.title}
      </h3>

      {/* Bounty */}
      <div className="flex items-baseline gap-2">
        <span className="font-heading font-bold text-2xl text-slate-900">${task.bounty}</span>
        <span className="text-slate-400 text-sm font-medium">USDC</span>
        {task.agreedPrice && task.agreedPrice !== task.bounty && (
          <span className="text-xs text-emerald-600 font-medium">
            (agreed: ${task.agreedPrice})
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {task.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="bg-slate-50 text-slate-500 px-2.5 py-1 text-xs rounded-lg font-medium border border-slate-100"
          >
            {tag}
          </span>
        ))}
        {task.tags.length > 3 && (
          <span className="text-slate-400 text-xs self-center">+{task.tags.length - 3}</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
        <span className="text-slate-400 text-xs font-mono truncate max-w-[120px]">
          {task.poster}
        </span>
        {hasBids && task.status === 'open' && (
          <span className="flex items-center gap-1.5 text-indigo-500 text-xs font-semibold">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            {task.bidCount} bid{task.bidCount !== 1 ? 's' : ''}
          </span>
        )}
        {task.worker && (
          <span className="text-slate-400 text-xs font-mono flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            {task.worker}
          </span>
        )}
      </div>
    </motion.div>
  );
}
