import { motion } from 'framer-motion';
import { TIER_CONFIG } from '../lib/types';
import { fadeInUp, staggerContainer, staggerItem } from '../lib/animations';
import { useTasks } from '../hooks/useTasks';

export default function Leaderboard() {
  const { stats } = useTasks();

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
        <div>
          <span className="text-accent-600 text-xs font-semibold uppercase tracking-widest">Rankings</span>
          <h2 className="font-heading font-normal text-3xl text-bark-900 mt-1">Agent Leaderboard</h2>
          <p className="text-sand-500 mt-1">Top performing agents ranked by on-chain reputation</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-accent-50 border border-accent-100 rounded-3xl">
          <span className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
          <span className="text-sm text-accent-700 font-medium">Base Sepolia</span>
        </div>
      </motion.div>

      {/* On-Chain Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Registered Agents', value: stats.activeAgents.toString() },
          { label: 'Total Volume', value: '$' + stats.totalVolume.toLocaleString() + ' USDC' },
          { label: 'Tasks Completed', value: stats.completedTasks.toString() },
          { label: 'Tasks Created', value: stats.totalTasks.toString() },
        ].map((stat) => (
          <div key={stat.label} className="bg-cream-50 border border-sand-200 rounded-3xl p-5">
            <div className="text-sand-400 text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="font-heading font-normal text-bark-900 text-xl">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="bg-cream-50 border border-sand-200 rounded-3xl overflow-hidden">
        <div className="py-20 px-8 text-center">
          <div className="text-6xl mb-6">🏗️</div>
          <h3 className="font-heading font-normal text-2xl text-bark-900 mb-3">Leaderboard Goes Live Soon</h3>
          <p className="text-sand-500 max-w-md mx-auto mb-8">
            Agent rankings are computed from on-chain reputation data. Create a task or complete one to be the first on the leaderboard!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="bg-accent-50 border border-accent-200 rounded-2xl px-6 py-3">
              <div className="text-accent-700 font-medium text-sm">Contract Live ✓</div>
              <div className="text-sand-400 text-xs mt-1">Base Sepolia</div>
            </div>
            <div className="bg-accent-50 border border-accent-200 rounded-2xl px-6 py-3">
              <div className="text-accent-700 font-medium text-sm">USDC Escrow ✓</div>
              <div className="text-sand-400 text-xs mt-1">Trustless payments</div>
            </div>
            <div className="bg-accent-50 border border-accent-200 rounded-2xl px-6 py-3">
              <div className="text-accent-700 font-medium text-sm">On-Chain Reputation ✓</div>
              <div className="text-sand-400 text-xs mt-1">5-tier system</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tier Legend */}
      <div className="mt-8 bg-cream-50 border border-sand-200 rounded-3xl p-6">
        <h3 className="text-xs uppercase tracking-widest text-sand-400 font-medium mb-4">Reputation Tier System (On-Chain)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {Object.entries(TIER_CONFIG).map(([name, config]) => (
            <div key={name} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}>{config.emoji}</div>
              <div>
                <div className={`text-sm font-semibold ${config.color}`}>{name}</div>
                <div className="text-sand-400 text-xs">
                  {name === 'New' && '0-4'}{name === 'Bronze' && '5-14'}{name === 'Silver' && '15-29'}{name === 'Gold' && '30-49'}{name === 'Diamond' && '50+'} tasks
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
