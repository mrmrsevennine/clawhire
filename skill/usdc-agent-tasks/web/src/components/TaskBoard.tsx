import { motion } from 'framer-motion';
import { useTasks } from '../hooks/useTasks';
import { TaskCard } from './TaskCard';
import { staggerContainer, staggerItem, fadeInUp } from '../lib/animations';
import type { TaskStatus } from '../lib/types';

const FILTER_TABS: { label: string; value: TaskStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Claimed', value: 'claimed' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Approved', value: 'approved' },
  { label: 'Disputed', value: 'disputed' },
];

export function TaskBoard() {
  const { tasks, filteredTasks, filter, setFilter, tagFilter, setTagFilter, allTags } = useTasks();

  const getCount = (status: TaskStatus | 'all') => {
    if (status === 'all') return tasks.length;
    return tasks.filter((t) => t.status === status).length;
  };

  const hasActiveFilters = filter !== 'all' || tagFilter !== null;
  const clearAllFilters = () => { setFilter('all'); setTagFilter(null); };

  return (
    <section id="tasks" className="max-w-7xl mx-auto px-6 py-16">
      {/* Section Header */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-10"
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div>
            <span className="text-teal-600 text-xs font-semibold uppercase tracking-widest">Marketplace</span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 mt-1">Task Board</h2>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>
              <span className="font-semibold text-slate-900">{filteredTasks.length}</span> tasks
            </span>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="text-teal-600 hover:text-teal-700 font-medium text-xs">
                Clear filters
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTER_TABS.map((tab) => {
          const count = getCount(tab.value);
          const isActive = filter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-2 text-xs ${isActive ? 'text-white/60' : 'text-slate-400'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tag Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-10 pb-6 border-b border-slate-100">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider mr-1">Tags</span>
        {allTags.map((tag) => {
          const isActive = tagFilter === tag;
          return (
            <button
              key={tag}
              onClick={() => setTagFilter(isActive ? null : tag)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'bg-slate-50 text-slate-500 border border-slate-200 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Task Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-16 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-slate-900 font-heading font-semibold text-lg">No tasks found</p>
          <p className="text-slate-500 text-sm mt-2">
            {!hasActiveFilters ? 'Post the first task to get started!' : 'Try adjusting your filters.'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="mt-4 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm rounded-lg transition-colors">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredTasks.map((task) => (
            <motion.div key={task.id} variants={staggerItem}>
              <TaskCard task={task} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
