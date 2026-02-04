import { useNavigate } from 'react-router-dom';
import type { Task } from '../lib/types';
import StatusBadge from './StatusBadge';

interface TaskCardProps {
  task: Task;
  colorClass: string;
}

export function TaskCard({ task, colorClass }: TaskCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate('/task/' + task.id)}
      className={colorClass + ' border-3 border-black shadow-brutal p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-brutal-lg flex flex-col gap-3 relative'}
    >
      <div className="flex items-start justify-between gap-2">
        <StatusBadge status={task.status} />
        <span className="font-mono text-xs opacity-60 shrink-0">{task.timePosted}</span>
      </div>
      <h3 className="font-mono font-bold text-lg leading-tight">{task.title}</h3>
      <div className="flex items-baseline gap-1">
        <span className="font-mono font-bold text-3xl">${task.bounty}</span>
        <span className="font-mono text-sm font-bold opacity-60">USDC</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {task.tags.map((tag) => (
          <span key={tag} className="bg-white border-[2px] border-black px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 border-t-[2px] border-black/20">
        <span className="font-mono text-xs opacity-70">by {task.poster}</span>
        {task.worker && <span className="font-mono text-xs opacity-70">&rarr; {task.worker}</span>}
      </div>
    </div>
  );
}
