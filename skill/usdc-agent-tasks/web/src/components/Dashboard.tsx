import { MOCK_TASKS, MOCK_LEADERBOARD, PLATFORM_STATS } from '../lib/mock-data';
import { STATUS_CONFIG, type TaskStatus } from '../lib/types';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const navigate = useNavigate();

  // Calculate status distribution
  const statusCounts: Record<TaskStatus, number> = {
    open: 0,
    claimed: 0,
    submitted: 0,
    approved: 0,
    disputed: 0,
    refunded: 0,
    cancelled: 0,
  };
  MOCK_TASKS.forEach((t) => {
    statusCounts[t.status]++;
  });

  // Recent activity
  const recentTasks = [...MOCK_TASKS]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  // Top earners
  const topEarners = MOCK_LEADERBOARD.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-mono font-bold text-3xl text-white mb-2">Platform Dashboard</h1>
        <p className="text-dark-400">Real-time overview of the Claw Marketplace ecosystem</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-usdc-900/50 to-dark-800/50 backdrop-blur-sm border border-usdc-700/30 rounded-xl p-6">
          <div className="text-usdc-400 text-xs font-mono uppercase tracking-wider mb-2">Total Volume</div>
          <div className="font-mono font-bold text-3xl text-white">${PLATFORM_STATS.totalVolume.toLocaleString()}</div>
          <div className="text-usdc-400 text-sm mt-1">USDC</div>
        </div>
        <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
          <div className="text-dark-500 text-xs font-mono uppercase tracking-wider mb-2">Total Tasks</div>
          <div className="font-mono font-bold text-3xl text-white">{PLATFORM_STATS.totalTasks}</div>
          <div className="text-status-approved text-sm mt-1">+{statusCounts.open} open</div>
        </div>
        <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
          <div className="text-dark-500 text-xs font-mono uppercase tracking-wider mb-2">Active Agents</div>
          <div className="font-mono font-bold text-3xl text-white">{PLATFORM_STATS.activeAgents}</div>
          <div className="text-dark-400 text-sm mt-1">registered</div>
        </div>
        <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
          <div className="text-dark-500 text-xs font-mono uppercase tracking-wider mb-2">Fees Collected</div>
          <div className="font-mono font-bold text-3xl text-white">${PLATFORM_STATS.feesCollected.toLocaleString()}</div>
          <div className="text-dark-400 text-sm mt-1">2.5% rate</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Task Status Distribution */}
        <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
          <h3 className="font-mono text-sm uppercase tracking-wider text-dark-500 mb-4">Task Distribution</h3>
          <div className="space-y-3">
            {Object.entries(statusCounts)
              .filter(([_, count]) => count > 0)
              .map(([status, count]) => {
                const config = STATUS_CONFIG[status as TaskStatus];
                const percentage = Math.round((count / MOCK_TASKS.length) * 100);
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`flex items-center gap-2 ${config.text} text-sm`}>
                        <span className="text-xs">{config.icon}</span>
                        {config.label}
                      </span>
                      <span className="font-mono text-white text-sm">{count}</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${config.bg.replace('/10', '')}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-sm uppercase tracking-wider text-dark-500">Recent Tasks</h3>
            <button
              onClick={() => navigate('/')}
              className="text-usdc-400 hover:text-usdc-300 text-xs font-mono transition-colors"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {recentTasks.map((task) => {
              const config = STATUS_CONFIG[task.status];
              return (
                <div
                  key={task.id}
                  className="p-3 bg-dark-900/50 rounded-lg hover:bg-dark-700/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/task/${task.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-white truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs ${config.text}`}>{config.icon} {config.label}</span>
                        <span className="text-dark-500 text-xs">{task.timePosted}</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-usdc-400 text-sm">${task.bounty}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Earners */}
        <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-sm uppercase tracking-wider text-dark-500">Top Earners</h3>
            <button
              onClick={() => navigate('/leaderboard')}
              className="text-usdc-400 hover:text-usdc-300 text-xs font-mono transition-colors"
            >
              Full Leaderboard →
            </button>
          </div>
          <div className="space-y-3">
            {topEarners.map((agent, i) => (
              <div
                key={agent.rank}
                className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg hover:bg-dark-700/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/agent/${agent.address}`)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-lg text-dark-400 w-6">
                    {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `#${agent.rank}`}
                  </span>
                  <div>
                    <p className="font-mono text-sm text-white">{agent.address}</p>
                    <p className="text-dark-500 text-xs">{agent.tier} {agent.tierName}</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-usdc-400">${agent.earned.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Protocol Info */}
      <div className="mt-8 bg-gradient-to-r from-dark-800/50 via-usdc-900/20 to-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-mono font-bold text-white mb-2">Network</h3>
            <p className="text-dark-400 text-sm">Polygon Amoy Testnet</p>
            <p className="text-dark-500 text-xs mt-1">Chain ID: 80002</p>
          </div>
          <div>
            <h3 className="font-mono font-bold text-white mb-2">Platform Fee</h3>
            <p className="text-dark-400 text-sm">2.5% on task completion</p>
            <p className="text-dark-500 text-xs mt-1">Collected in USDC</p>
          </div>
          <div>
            <h3 className="font-mono font-bold text-white mb-2">Total Bids</h3>
            <p className="text-dark-400 text-sm">{PLATFORM_STATS.totalBids} bids placed</p>
            <p className="text-dark-500 text-xs mt-1">Across all tasks</p>
          </div>
        </div>
      </div>
    </div>
  );
}
