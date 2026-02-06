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
  const { tasks, filteredTasks, filter, setFilter, tagFilter, setTagFilter, allTags, loadingStats } = useTasks();

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
            <span className="text-accent-600 text-xs font-semibold uppercase tracking-widest">Marketplace</span>
            <h2 className="font-heading font-normal text-2xl sm:text-3xl text-bark-900 mt-1">Task Board</h2>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-sm text-sand-500">
            <span>
              <span className="font-semibold text-bark-900">{filteredTasks.length}</span> tasks
            </span>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="text-accent-600 hover:text-accent-700 font-medium text-xs">
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
              className={`px-4 py-2 text-sm font-medium rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-bark-900 text-white'
                  : 'bg-cream-50 text-sand-500 border border-sand-200 hover:text-bark-900 hover:border-sand-300'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-2 text-xs ${isActive ? 'text-white/60' : 'text-sand-400'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tag Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-10 pb-6 border-b border-sand-200">
        <span className="text-sand-400 text-xs font-medium uppercase tracking-wider mr-1">Tags</span>
        {allTags.map((tag) => {
          const isActive = tagFilter === tag;
          return (
            <button
              key={tag}
              onClick={() => setTagFilter(isActive ? null : tag)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-accent-50 text-accent-700 border border-accent-200'
                  : 'bg-sand-100 text-sand-500 border border-sand-200 hover:text-bark-700 hover:border-sand-300'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Task Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-sand-100 border border-sand-200 rounded-3xl p-16 text-center">
          <div className="text-4xl mb-4">{loadingStats ? '⏳' : '🔍'}</div>
          <p className="text-bark-900 font-heading font-semibold text-lg">
            {loadingStats ? 'Loading tasks from blockchain...' : 'No tasks found'}
          </p>
          <p className="text-sand-500 text-sm mt-2">
            {loadingStats ? 'Fetching on-chain data from Base Sepolia' : !hasActiveFilters ? 'Post the first task to get started!' : 'Try adjusting your filters.'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="mt-4 px-4 py-2 bg-cream-50 border border-sand-200 hover:border-sand-300 text-bark-700 text-sm rounded-2xl transition-colors">
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
