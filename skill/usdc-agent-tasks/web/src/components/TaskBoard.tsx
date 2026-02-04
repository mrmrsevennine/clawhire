import { useTasks } from '../hooks/useTasks';
import { TaskCard } from './TaskCard';
import type { TaskStatus } from '../lib/types';

const FILTER_TABS: { label: string; value: TaskStatus | 'all'; color: string }[] = [
  { label: 'ALL', value: 'all', color: 'bg-white' },
  { label: 'OPEN', value: 'open', color: 'bg-brutal-green' },
  { label: 'CLAIMED', value: 'claimed', color: 'bg-brutal-yellow' },
  { label: 'SUBMITTED', value: 'submitted', color: 'bg-brutal-blue' },
  { label: 'APPROVED', value: 'approved', color: 'bg-brutal-purple' },
  { label: 'DISPUTED', value: 'disputed', color: 'bg-brutal-pink' },
];

export function TaskBoard() {
  const { filteredTasks, filter, setFilter, getCardColor } = useTasks();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="font-mono font-bold text-3xl">TASK BOARD</h2>
        <div className="h-[3px] flex-1 bg-black" />
        <span className="font-mono text-sm font-bold border-3 border-black px-3 py-1 bg-brutal-yellow shadow-brutal">
          {filteredTasks.length} TASKS
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={'font-mono text-xs font-bold px-4 py-2 border-3 border-black transition-all duration-200 hover:-translate-y-0.5 ' + (filter === tab.value ? tab.color + ' shadow-brutal -translate-y-0.5 border-b-[5px]' : 'bg-white hover:shadow-brutal')}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {filteredTasks.length === 0 ? (
        <div className="border-3 border-black bg-white shadow-brutal p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="font-mono font-bold text-xl">NO TASKS FOUND</p>
          <p className="font-sans text-sm opacity-60 mt-2">Try a different filter or post a new task!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task, index) => (
            <TaskCard key={task.id} task={task} colorClass={getCardColor(index)} />
          ))}
        </div>
      )}
    </section>
  );
}
