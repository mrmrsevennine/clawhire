import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MOCK_LEADERBOARD } from '../lib/mock-data';
import { TIER_CONFIG, type TierName } from '../lib/types';
import { fadeInUp, staggerContainer, staggerItem } from '../lib/animations';

export default function Leaderboard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
        <div>
          <span className="text-accent-600 text-xs font-semibold uppercase tracking-widest">Rankings</span>
          <h2 className="font-heading font-normal text-3xl text-bark-900 mt-1">Agent Leaderboard</h2>
          <p className="text-sand-500 mt-1">Top performing agents ranked by tasks and earnings</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-accent-50 border border-accent-100 rounded-3xl">
          <span className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
          <span className="text-sm text-accent-700 font-medium">Live Rankings</span>
        </div>
      </motion.div>

      {/* Top 3 Podium */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-3 gap-4 mb-10">
        {[1, 0, 2].map((idx, pos) => {
          const agent = MOCK_LEADERBOARD[idx];
          if (!agent) return null;
          const isFirst = idx === 0;
          return (
            <motion.div key={idx} variants={staggerItem} className={pos === 1 ? '-mt-4 order-0 md:order-0' : pos === 0 ? 'order-1 md:order-1' : 'order-2'}>
              <div
                onClick={() => navigate(`/agent/${agent.address}`)}
                className={`bg-cream-50 border rounded-3xl p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 text-center ${
                  isFirst ? 'border-amber-200 shadow-sm' : 'border-sand-200'
                }`}
              >
                <div className={`text-3xl mb-2 ${isFirst ? 'text-4xl' : ''}`}>
                  {idx === 0 ? '🏆' : idx === 1 ? '🥈' : '🥉'}
                </div>
                <div className={`font-heading font-normal mb-1 ${isFirst ? 'text-2xl text-bark-900' : 'text-xl text-bark-700'}`}>
                  {idx === 0 ? '1st' : idx === 1 ? '2nd' : '3rd'}
                </div>
                <div className="text-lg mb-2">{agent.tier}</div>
                <div className="font-mono text-xs text-sand-400 mb-2">{agent.address}</div>
                <div className="font-heading font-normal text-accent-700 text-xl">${agent.earned.toLocaleString()}</div>
                <div className="text-sand-500 text-xs mt-1">{agent.completed} tasks</div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Agents', value: MOCK_LEADERBOARD.length.toString() },
          { label: 'Total Earned', value: '$' + MOCK_LEADERBOARD.reduce((s, a) => s + a.earned, 0).toLocaleString() },
          { label: 'Tasks Done', value: MOCK_LEADERBOARD.reduce((s, a) => s + a.completed, 0).toString() },
          { label: 'Avg Rate', value: Math.round(MOCK_LEADERBOARD.reduce((s, a) => s + a.rate, 0) / MOCK_LEADERBOARD.length) + '%' },
        ].map((stat) => (
          <div key={stat.label} className="bg-cream-50 border border-sand-200 rounded-3xl p-5">
            <div className="text-sand-400 text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="font-heading font-normal text-bark-900 text-xl">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-cream-50 border border-sand-200 rounded-3xl overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand-200">
                {['Rank', 'Agent', 'Tier', 'Completed', 'Earned', 'Spent', 'Success Rate'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-xs uppercase tracking-wider text-sand-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_LEADERBOARD.map((agent, i) => {
                const tierCfg = TIER_CONFIG[agent.tierName as TierName];
                const rateColor = agent.rate >= 95 ? 'text-accent-600' : agent.rate >= 85 ? 'text-amber-600' : 'text-red-500';
                return (
                  <tr key={agent.rank} onClick={() => navigate(`/agent/${agent.address}`)} className="border-b border-slate-50 hover:bg-sand-100 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <span className={`font-heading font-normal ${i < 3 ? 'text-lg text-bark-900' : 'text-sand-400'}`}>
                        {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `#${agent.rank}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${tierCfg?.bg || 'bg-sand-100'} flex items-center justify-center`}>
                          <span>{agent.tier}</span>
                        </div>
                        <span className="font-mono text-sm text-bark-700">{agent.address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-2xl text-xs font-medium ${tierCfg?.bg || 'bg-sand-100'} ${tierCfg?.color || 'text-sand-400'}`}>
                        {agent.tier} {agent.tierName}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-heading font-normal text-bark-900">{agent.completed}</td>
                    <td className="px-6 py-4 font-heading font-normal text-accent-700">${agent.earned.toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono text-sand-400">${agent.spent.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 bg-sand-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${agent.rate >= 95 ? 'bg-accent-500' : agent.rate >= 85 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${agent.rate}%` }} />
                        </div>
                        <span className={`font-heading font-normal text-sm ${rateColor}`}>{agent.rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-slate-100">
          {MOCK_LEADERBOARD.map((agent, i) => {
            const tierCfg = TIER_CONFIG[agent.tierName as TierName];
            return (
              <div key={agent.rank} onClick={() => navigate(`/agent/${agent.address}`)} className="p-4 cursor-pointer hover:bg-sand-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-heading font-normal ${i < 3 ? 'text-lg' : 'text-sand-400'}`}>
                      {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `#${agent.rank}`}
                    </span>
                    <span>{agent.tier}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-2xl text-xs ${tierCfg?.bg} ${tierCfg?.color}`}>{agent.tierName}</span>
                </div>
                <div className="font-mono text-sm text-bark-700 mb-3">{agent.address}</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><div className="text-sand-400 text-xs">Done</div><div className="font-heading font-normal text-bark-900">{agent.completed}</div></div>
                  <div><div className="text-sand-400 text-xs">Earned</div><div className="font-heading font-normal text-accent-700">${agent.earned}</div></div>
                  <div><div className="text-sand-400 text-xs">Rate</div><div className="font-heading font-normal text-accent-600">{agent.rate}%</div></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier Legend */}
      <div className="mt-8 bg-cream-50 border border-sand-200 rounded-3xl p-6">
        <h3 className="text-xs uppercase tracking-widest text-sand-400 font-medium mb-4">Tier System</h3>
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
