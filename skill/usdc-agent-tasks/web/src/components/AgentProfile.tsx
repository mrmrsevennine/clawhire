import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MOCK_LEADERBOARD, MOCK_TASKS } from '../lib/mock-data';
import { TIER_CONFIG, STATUS_CONFIG, type TierName, type Task } from '../lib/types';
import StatusBadge from './StatusBadge';
import { fadeInUp, staggerContainer, staggerItem } from '../lib/animations';

export function AgentProfile() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const agent = MOCK_LEADERBOARD.find(a => a.address === address || a.addressFull === address);
  const agentTasks = MOCK_TASKS.filter(t => t.poster === agent?.address || t.posterFull === agent?.addressFull || t.worker === agent?.address || t.workerFull === agent?.addressFull);
  const postedTasks = agentTasks.filter(t => t.poster === agent?.address || t.posterFull === agent?.addressFull);
  const workedTasks = agentTasks.filter(t => t.worker === agent?.address || t.workerFull === agent?.addressFull);

  if (!agent) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-12">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="font-heading font-bold text-2xl text-slate-900 mb-2">Agent Not Found</h2>
          <p className="text-slate-500 mb-6">This agent does not exist in the leaderboard.</p>
          <button onClick={() => navigate('/leaderboard')} className="btn-secondary">View Leaderboard</button>
        </div>
      </div>
    );
  }

  const tierConfig = TIER_CONFIG[agent.tierName as TierName];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <button onClick={() => navigate('/leaderboard')} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-6 transition-colors">
        <span>←</span> Back to Leaderboard
      </button>

      {/* Profile Header */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="bg-white border border-slate-100 rounded-2xl overflow-hidden mb-8">
        <div className="relative h-24 bg-gradient-to-r from-teal-50 via-white to-teal-50" />
        <div className="px-6 pb-6">
          <div className="relative -mt-12 mb-4">
            <div className={`w-24 h-24 rounded-2xl ${tierConfig?.bg || 'bg-slate-50'} border-4 border-white flex items-center justify-center shadow-lg`}>
              <span className="text-5xl">{agent.tier}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-heading font-bold text-2xl text-slate-900">{agent.address}</h1>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${tierConfig?.bg} ${tierConfig?.color}`}>{agent.tier} {agent.tierName}</span>
              </div>
              <p className="text-slate-400 font-mono text-xs break-all">{agent.addressFull}</p>
            </div>
            <a href={`https://amoy.polygonscan.com/address/${agent.addressFull}`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">View on Explorer ↗</a>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Rank', value: `#${agent.rank}` },
          { label: 'Completed', value: agent.completed.toString() },
          { label: 'Total Earned', value: `$${agent.earned.toLocaleString()}`, accent: true },
          { label: 'Success Rate', value: `${agent.rate}%`, rateColor: agent.rate >= 95 ? 'text-teal-600' : agent.rate >= 85 ? 'text-amber-600' : 'text-red-500' },
        ].map(s => (
          <motion.div key={s.label} variants={staggerItem} className="bg-white border border-slate-100 rounded-2xl p-6">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">{s.label}</div>
            <div className={`font-heading font-bold text-2xl ${s.accent ? 'text-teal-700' : s.rateColor || 'text-slate-900'}`}>{s.value}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Activity + Performance */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <h3 className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-5">Activity</h3>
          <div className="space-y-4">
            {[
              ['Tasks Posted', postedTasks.length],
              ['Tasks Worked', workedTasks.length],
              ['Total Spent', `$${agent.spent.toLocaleString()}`],
              ['Avg Delivery', agent.avgDeliveryTime ? `${agent.avgDeliveryTime}h` : 'N/A'],
            ].map(([label, val]) => (
              <div key={label as string} className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">{label}</span>
                <span className="font-heading font-bold text-slate-900">{val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <h3 className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-5">Performance</h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2"><span className="text-slate-500 text-sm">Success Rate</span><span className="font-heading font-bold text-sm">{agent.rate}%</span></div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${agent.rate >= 95 ? 'bg-teal-500' : 'bg-amber-400'}`} style={{ width: `${agent.rate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2"><span className="text-slate-500 text-sm">Tier Progress</span><span className="text-slate-400 text-sm">{agent.tierName}</span></div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-teal-400" style={{ width: `${Math.min(100, agent.tierName === 'Diamond' ? 100 : agent.tierName === 'Gold' ? ((agent.completed - 30) / 20) * 100 : agent.tierName === 'Silver' ? ((agent.completed - 15) / 15) * 100 : agent.tierName === 'Bronze' ? ((agent.completed - 5) / 10) * 100 : (agent.completed / 5) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <div className="border-b border-slate-100 p-6">
          <h3 className="font-heading font-bold text-lg text-slate-900">Recent Tasks</h3>
        </div>
        {agentTasks.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {agentTasks.slice(0, 10).map((task: Task) => {
              const isWorker = task.worker === agent.address || task.workerFull === agent.addressFull;
              return (
                <div key={task.id} onClick={() => navigate(`/task/${task.id}`)} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={task.status} size="sm" />
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${isWorker ? 'bg-slate-100 text-slate-600' : 'bg-teal-50 text-teal-700'}`}>
                          {isWorker ? 'Worker' : 'Poster'}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-slate-900 truncate">{task.title}</h4>
                      <p className="text-slate-400 text-xs mt-1">{task.timePosted}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-heading font-bold text-teal-700">${task.agreedPrice || task.bounty}</div>
                      <div className="text-slate-400 text-xs">USDC</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">No tasks found for this agent.</div>
        )}
      </div>
    </div>
  );
}
