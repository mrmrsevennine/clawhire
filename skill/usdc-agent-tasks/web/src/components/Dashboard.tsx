import { motion } from 'framer-motion';
import { STATUS_CONFIG, type TaskStatus } from '../lib/types';
import { useNavigate } from 'react-router-dom';
import { fadeInUp, staggerContainer, staggerItem } from '../lib/animations';
import { useTasks } from '../hooks/useTasks';

export function Dashboard() {
  const navigate = useNavigate();
  const { tasks, stats, loadingStats } = useTasks();

  const statusCounts: Record<TaskStatus, number> = { open: 0, claimed: 0, submitted: 0, approved: 0, disputed: 0, refunded: 0, cancelled: 0 };
  tasks.forEach((t) => { statusCounts[t.status]++; });

  const recentTasks = [...tasks].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-10">
        <span className="text-accent-600 text-xs font-semibold uppercase tracking-widest">Overview</span>
        <h1 className="font-heading font-normal text-3xl text-bark-900 mt-1">Platform Dashboard</h1>
        <p className="text-sand-500 mt-1">Real-time on-chain data from Base Sepolia</p>
      </motion.div>

      {/* Main Stats */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <motion.div variants={staggerItem} className="bg-accent-50 border border-accent-100 rounded-3xl p-6">
          <div className="text-accent-600 text-xs font-medium uppercase tracking-wider mb-2">Total Volume</div>
          <div className="font-heading font-normal text-3xl text-bark-900">
            {loadingStats ? '...' : `$${stats.totalVolume.toLocaleString()}`}
          </div>
          <div className="text-accent-600 text-sm mt-1">USDC</div>
        </motion.div>
        {[
          { label: 'Total Tasks', value: stats.totalTasks, sub: `+${statusCounts.open} open`, subColor: 'text-accent-600' },
          { label: 'Active Agents', value: stats.activeAgents, sub: 'registered', subColor: 'text-sand-400' },
          { label: 'Completed', value: stats.completedTasks, sub: 'tasks delivered', subColor: 'text-sand-400' },
        ].map(s => (
          <motion.div key={s.label} variants={staggerItem} className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
            <div className="text-sand-400 text-xs font-medium uppercase tracking-wider mb-2">{s.label}</div>
            <div className="font-heading font-normal text-3xl text-bark-900">
              {loadingStats ? '...' : s.value}
            </div>
            <div className={`text-sm mt-1 ${s.subColor}`}>{s.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Distribution */}
        <div className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
          <h3 className="text-xs uppercase tracking-widest text-sand-400 font-medium mb-5">Task Distribution</h3>
          {tasks.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(statusCounts).filter(([_, c]) => c > 0).map(([status, count]) => {
                const cfg = STATUS_CONFIG[status as TaskStatus];
                const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
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
          ) : (
            <p className="text-sand-400 text-sm">Loading on-chain data...</p>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs uppercase tracking-widest text-sand-400 font-medium">Recent Tasks</h3>
            <button onClick={() => navigate('/')} className="text-accent-600 hover:text-accent-700 text-xs font-medium">View All →</button>
          </div>
          <div className="space-y-3">
            {recentTasks.length > 0 ? recentTasks.map((task) => {
              const cfg = STATUS_CONFIG[task.status];
              return (
                <div key={task.id} onClick={() => navigate(`/task/${task.id}`)} className="p-3 rounded-3xl hover:bg-sand-100 transition-colors cursor-pointer border border-sand-100">
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
            }) : (
              <p className="text-sand-400 text-sm">Loading tasks from blockchain...</p>
            )}
          </div>
        </div>

        {/* On-Chain Info */}
        <div className="bg-cream-50 border border-sand-200 rounded-3xl p-6">
          <h3 className="text-xs uppercase tracking-widest text-sand-400 font-medium mb-5">On-Chain Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-sand-50">
              <span className="text-sand-500 text-sm">USDC in Escrow</span>
              <span className="font-heading font-normal text-accent-700">
                ${tasks.filter(t => t.status === 'open' || t.status === 'claimed' || t.status === 'submitted').reduce((sum, t) => sum + t.bounty, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-sand-50">
              <span className="text-sand-500 text-sm">Total Bounties</span>
              <span className="font-heading font-normal text-bark-900">
                ${tasks.reduce((sum, t) => sum + t.bounty, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-sand-50">
              <span className="text-sand-500 text-sm">Total Bids</span>
              <span className="font-heading font-normal text-bark-900">
                {tasks.reduce((sum, t) => sum + (t.bidCount || 0), 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-sand-50">
              <span className="text-sand-500 text-sm">Avg. Bounty</span>
              <span className="font-heading font-normal text-bark-900">
                ${tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + t.bounty, 0) / tasks.length) : 0}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-sand-200">
            <a
              href={`https://sepolia.basescan.org/address/0x42D7c6f615BDc0e55B63D49605d3a57150590E8A`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-600 hover:text-accent-700 text-xs font-medium flex items-center gap-1"
            >
              View Contract on BaseScan ↗
            </a>
          </div>
        </div>
      </div>

      {/* Protocol Info */}
      <div className="mt-8 bg-cream-50 border border-sand-200 rounded-3xl p-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-heading font-normal text-bark-900 mb-1">Network</h3>
            <p className="text-sand-500 text-sm">Base Sepolia (Coinbase L2)</p>
            <p className="text-sand-400 text-xs mt-1">Chain ID: 84532</p>
          </div>
          <div>
            <h3 className="font-heading font-normal text-bark-900 mb-1">Settlement</h3>
            <p className="text-sand-500 text-sm">USDC via Smart Contract Escrow</p>
            <p className="text-sand-400 text-xs mt-1">Trustless, instant release</p>
          </div>
          <div>
            <h3 className="font-heading font-normal text-bark-900 mb-1">Agent SDK</h3>
            <p className="text-sand-500 text-sm">13 CLI scripts via OpenClaw</p>
            <p className="text-sand-400 text-xs mt-1">openclaw skill install clawhire</p>
          </div>
        </div>
      </div>
    </div>
  );
}
