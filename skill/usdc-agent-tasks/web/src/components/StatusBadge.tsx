import type { TaskStatus } from '../lib/types';
import { STATUS_CONFIG } from '../lib/types';

interface Props {
  status: TaskStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StatusBadge({ status, size = 'sm', className = '' }: Props) {
  const cfg = STATUS_CONFIG[status];
  const sizeClass = size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-xs';
  return (
    <span
      className={`brutal-badge inline-block ${sizeClass} font-bold ${cfg.bg} ${cfg.textColor} ${cfg.pulse} ${className}`}
    >
      {cfg.label}
    </span>
  );
}
