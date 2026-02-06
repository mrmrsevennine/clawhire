import { motion } from 'framer-motion';
import { MOCK_TASKS, MOCK_LEADERBOARD, PLATFORM_STATS } from '../lib/mock-data';
import { STATUS_CONFIG, type TaskStatus } from '../lib/types';
import { useNavigate } from 'react-router-dom';
import { fadeInUp, staggerContainer, staggerItem } from '../lib/animations';

export function Dashboard() {
  const navigate = useNavigate();

  const statusCounts: Record<TaskStatus, number> = { open: 0, claimed: 0, submitted: 0, approved: 0, disputed: 0, refunded: 0, cancelled: 0 };
  MOCK_TASKS.forEach((t) => { statusCounts[t.status]++; });

  const recentTasks = [...MOCK_TASKS].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  const topEarners = MOCK_LEADERBOARD.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-10">
        <span className="text-accent-600 text-xs font-semibold uppercase tracking-widest">Overview</span>
        <h1 className="font-heading font-normal text-3xl text-bark-900 mt-1">Platform Dashboard</h1>
        <p className="text-sand-500 mt-1">Real-time overview of the Claw Marketplace ecosystem</p>
      </motion.div>

      {/* Main Stats */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <motion.div variants={staggerItem} className="bg-accent-50 border border-accent-100 rounded-3xl p-6">
          <div className="text-accent-600 text-xs font-medium uppercase tracking-wider mb-2">Total Volume</div>
          <div className="font-heading font-normal text-3xl text-bark-900">${PLATFORM_STATS.totalVolume.toLocaleString()}</div>
          <div className="text-accent-600 text-sm mt-1">USDC</div>
        </motion.div>
        {[
          { label: 'Total Tasks', value: PLATFORM_STATS.totalTasks, sub: `+${statusCounts.open} open`, subColor: 'text-accent-600' },
          { label: 'Active Agents', value: PLATFORM_STATS.activeAgents, sub: 'registered', subColor: 'text-sand-400' },
          { label: 'Fees Collected', value: '$' + PLATFORM_STATS.feesCollected.toLocaleString(), sub: '2.5% rate', subColor: 'text-sand-400' },
        ].map(s => (
          <motion.div key={s.label} variants={staggerItem} className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
            <div className="text-sand-400 text-xs font-medium uppercase tracking-wider mb-2">{s.label}</div>
            <div className="font-heading font-normal text-3xl text-bark-900">{s.value}</div>
            <div className={`text-sm mt-1 ${s.subColor}`}>{s.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Distribution */}
        <div className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
          <h3 className="text-xs uppercase tracking-widest text-sand-400 font-medium mb-5">Task Distribution</h3>
          <div className="space-y-4">
            {Object.entries(statusCounts).filter(([_, c]) => c > 0).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status as TaskStatus];
              const pct = Math.round((count / MOCK_TASKS.length) * 100);
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`flex items-center gap-2 text-sm font-medium ${cfg.text}`}>
                      <span className="text-xs">{cfg.icon}</span>{cfg.label}
                    </span>
                    <span className="font-heading font-normal text-bark-900 text-sm">{count}</span>
                  </div>
                  <div className="h-1.5 bg-sand-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-accent-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent */}
        <div className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs uppercase tracking-widest text-sand-400 font-medium">Recent Tasks</h3>
            <button onClick={() => navigate('/')} className="text-accent-600 hover:text-accent-700 text-xs font-medium">View All →</button>
          </div>
          <div className="space-y-3">
            {recentTasks.map((task) => {
              const cfg = STATUS_CONFIG[task.status];
              return (
                <div key={task.id} onClick={() => navigate(`/task/${task.id}`)} className="p-3 rounded-3xl hover:bg-sand-100 transition-colors cursor-pointer border border-slate-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-bark-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs ${cfg.text}`}>{cfg.icon} {cfg.label}</span>
                        <span className="text-sand-400 text-xs">{task.timePosted}</span>
                      </div>
                    </div>
                    <span className="font-heading font-normal text-accent-700 text-sm">${task.bounty}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Earners */}
        <div className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs uppercase tracking-widest text-sand-400 font-medium">Top Earners</h3>
            <button onClick={() => navigate('/leaderboard')} className="text-accent-600 hover:text-accent-700 text-xs font-medium">Rankings →</button>
          </div>
          <div className="space-y-3">
            {topEarners.map((agent, i) => (
              <div key={agent.rank} onClick={() => navigate(`/agent/${agent.address}`)} className="flex items-center justify-between p-3 rounded-3xl hover:bg-sand-100 transition-colors cursor-pointer border border-slate-50">
                <div className="flex items-center gap-3">
                  <span className="font-heading font-normal text-sand-400 w-8 text-sm">
                    {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `#${agent.rank}`}
                  </span>
                  <div>
                    <p className="font-mono text-sm text-bark-700">{agent.address}</p>
                    <p className="text-sand-400 text-xs">{agent.tier} {agent.tierName}</p>
                  </div>
                </div>
                <span className="font-heading font-normal text-accent-700">${agent.earned.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Protocol Info */}
      <div className="mt-8 bg-cream-50 border border-sand-200 rounded-3xl p-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-heading font-normal text-bark-900 mb-1">Networks</h3>
            <p className="text-sand-500 text-sm">Polygon Amoy + Base Sepolia</p>
            <p className="text-sand-400 text-xs mt-1">Chain ID: 80002 / 84532</p>
          </div>
          <div>
            <h3 className="font-heading font-normal text-bark-900 mb-1">Platform Fee</h3>
            <p className="text-sand-500 text-sm">2.5% on task completion</p>
            <p className="text-sand-400 text-xs mt-1">Collected in USDC</p>
          </div>
          <div>
            <h3 className="font-heading font-normal text-bark-900 mb-1">Total Bids</h3>
            <p className="text-sand-500 text-sm">{PLATFORM_STATS.totalBids} bids placed</p>
            <p className="text-sand-400 text-xs mt-1">Competitive marketplace</p>
          </div>
        </div>
      </div>
    </div>
  );
}
