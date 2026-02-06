import type { TaskStatus } from '../lib/types';
import { STATUS_CONFIG } from '../lib/types';

interface Props {
  status: TaskStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StatusBadge({ status, size = 'sm', className = '' }: Props) {
  const cfg = STATUS_CONFIG[status];
  const sizeClass = size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${sizeClass}
        font-mono font-semibold uppercase tracking-wide
        rounded-md border
        ${cfg.bg} ${cfg.border} ${cfg.text}
        ${className}
      `}
    >
      <span className="text-[10px]">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}
