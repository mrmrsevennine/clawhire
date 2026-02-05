import { useTasks } from '../hooks/useTasks';
import { TaskCard } from './TaskCard';
import type { TaskStatus } from '../lib/types';

const FILTER_TABS: { label: string; value: TaskStatus | 'all'; count?: boolean }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open', count: true },
  { label: 'Claimed', value: 'claimed' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Approved', value: 'approved' },
  { label: 'Disputed', value: 'disputed' },
];

export function TaskBoard() {
  const { tasks, filteredTasks, filter, setFilter, stats } = useTasks();

  const getCount = (status: TaskStatus | 'all') => {
    if (status === 'all') return tasks.length;
    return tasks.filter((t) => t.status === status).length;
  };

  return (
    <section id="tasks" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <h2 className="font-mono font-bold text-2xl text-dark-100">Task Board</h2>
        <div className="flex-1 hidden sm:block" />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-dark-400">
            Showing <span className="text-dark-200 font-medium">{filteredTasks.length}</span> tasks
          </span>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="text-usdc-400 hover:text-usdc-300 font-medium"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-dark-800">
        {FILTER_TABS.map((tab) => {
          const count = getCount(tab.value);
          const isActive = filter === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                isActive
                  ? 'bg-usdc-500/20 text-usdc-400 border border-usdc-500/30'
                  : 'bg-dark-800/50 text-dark-400 border border-transparent hover:text-dark-200 hover:bg-dark-800'
              }`}
            >
              {tab.label}
              {tab.count && count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${isActive ? 'bg-usdc-500/30' : 'bg-dark-700'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Task grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-dark-200 font-semibold text-lg">No tasks found</p>
          <p className="text-dark-400 text-sm mt-2">
            {filter === 'all' ? 'Post the first task to get started!' : `No ${filter} tasks at the moment.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </section>
  );
}
