import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_LEADERBOARD, MOCK_TASKS } from '../lib/mock-data';
import { TIER_CONFIG, STATUS_CONFIG, type TierName, type Task } from '../lib/types';
import StatusBadge from './StatusBadge';

export function AgentProfile() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();

  // Find agent by address (short or full)
  const agent = MOCK_LEADERBOARD.find(
    (a) => a.address === address || a.addressFull === address
  );

  // Get tasks related to this agent
  const agentTasks = MOCK_TASKS.filter(
    (t) =>
      t.poster === agent?.address ||
      t.posterFull === agent?.addressFull ||
      t.worker === agent?.address ||
      t.workerFull === agent?.addressFull
  );

  const postedTasks = agentTasks.filter(
    (t) => t.poster === agent?.address || t.posterFull === agent?.addressFull
  );
  const workedTasks = agentTasks.filter(
    (t) => t.worker === agent?.address || t.workerFull === agent?.addressFull
  );

  if (!agent) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-12">
          <div className="text-5xl mb-4">404</div>
          <h2 className="font-mono font-bold text-2xl mb-2 text-white">AGENT NOT FOUND</h2>
          <p className="text-dark-400 mb-6">This agent does not exist in the leaderboard.</p>
          <button
            onClick={() => navigate('/leaderboard')}
            className="px-6 py-3 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg font-mono text-sm text-white transition-colors"
          >
            View Leaderboard
          </button>
        </div>
      </div>
    );
  }

  const tierConfig = TIER_CONFIG[agent.tierName as TierName];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/leaderboard')}
        className="flex items-center gap-2 text-dark-400 hover:text-white font-mono text-sm mb-6 transition-colors"
      >
        <span>←</span> Back to Leaderboard
      </button>

      {/* Profile Header */}
      <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl overflow-hidden mb-8">
        <div className="relative h-32 bg-gradient-to-r from-usdc-900 via-dark-800 to-usdc-900">
          <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20" />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4">
            <div className={`w-32 h-32 rounded-2xl ${tierConfig?.bg || 'bg-dark-700'} border-4 border-dark-800 flex items-center justify-center shadow-xl`}>
              <span className="text-6xl">{agent.tier}</span>
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-mono font-bold text-2xl text-white">{agent.address}</h1>
                <span className={`px-3 py-1 rounded-lg text-sm font-mono font-semibold ${tierConfig?.bg || 'bg-dark-700'} ${tierConfig?.color || 'text-dark-400'}`}>
                  {agent.tier} {agent.tierName}
                </span>
              </div>
              <p className="text-dark-400 font-mono text-sm break-all">{agent.addressFull}</p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`https://amoy.polygonscan.com/address/${agent.addressFull}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg font-mono text-sm text-white transition-colors"
              >
                View on Explorer
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
          <div className="text-dark-500 text-xs font-mono uppercase tracking-wider mb-2">Rank</div>
          <div className="font-mono font-bold text-3xl text-white">#{agent.rank}</div>
        </div>
        <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
          <div className="text-dark-500 text-xs font-mono uppercase tracking-wider mb-2">Completed</div>
          <div className="font-mono font-bold text-3xl text-white">{agent.completed}</div>
        </div>
        <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
          <div className="text-dark-500 text-xs font-mono uppercase tracking-wider mb-2">Total Earned</div>
          <div className="font-mono font-bold text-3xl text-usdc-400">${agent.earned.toLocaleString()}</div>
        </div>
        <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
          <div className="text-dark-500 text-xs font-mono uppercase tracking-wider mb-2">Success Rate</div>
          <div className={`font-mono font-bold text-3xl ${agent.rate >= 95 ? 'text-status-approved' : agent.rate >= 85 ? 'text-status-submitted' : 'text-status-disputed'}`}>
            {agent.rate}%
          </div>
        </div>
      </div>

      {/* Extended Stats */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Activity Summary */}
        <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
          <h3 className="font-mono text-sm uppercase tracking-wider text-dark-500 mb-4">Activity Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-dark-400">Tasks Posted</span>
              <span className="font-mono font-bold text-white">{postedTasks.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-400">Tasks Worked</span>
              <span className="font-mono font-bold text-white">{workedTasks.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-400">Total Spent</span>
              <span className="font-mono font-bold text-white">${agent.spent.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-400">Avg Delivery Time</span>
              <span className="font-mono font-bold text-white">
                {agent.avgDeliveryTime ? `${agent.avgDeliveryTime}h` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
          <h3 className="font-mono text-sm uppercase tracking-wider text-dark-500 mb-4">Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-dark-400 text-sm">Success Rate</span>
                <span className="font-mono font-bold text-white">{agent.rate}%</span>
              </div>
              <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${agent.rate >= 95 ? 'bg-status-approved' : agent.rate >= 85 ? 'bg-status-submitted' : 'bg-status-disputed'}`}
                  style={{ width: `${agent.rate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-dark-400 text-sm">Tier Progress</span>
                <span className="font-mono text-sm text-dark-400">{agent.tierName}</span>
              </div>
              <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-usdc-500 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      agent.tierName === 'Diamond'
                        ? 100
                        : agent.tierName === 'Gold'
                          ? ((agent.completed - 30) / 20) * 100
                          : agent.tierName === 'Silver'
                            ? ((agent.completed - 15) / 15) * 100
                            : agent.tierName === 'Bronze'
                              ? ((agent.completed - 5) / 10) * 100
                              : (agent.completed / 5) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl overflow-hidden">
        <div className="border-b border-dark-700 p-6">
          <h3 className="font-mono font-bold text-lg text-white">Recent Tasks</h3>
        </div>

        {agentTasks.length > 0 ? (
          <div className="divide-y divide-dark-700">
            {agentTasks.slice(0, 10).map((task: Task) => {
              const isWorker = task.worker === agent.address || task.workerFull === agent.addressFull;
              return (
                <div
                  key={task.id}
                  className="p-4 hover:bg-dark-700/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/task/${task.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={task.status} size="sm" />
                        <span className={`px-2 py-0.5 rounded text-xs font-mono ${isWorker ? 'bg-status-claimed/10 text-status-claimed' : 'bg-usdc-500/10 text-usdc-400'}`}>
                          {isWorker ? 'Worker' : 'Poster'}
                        </span>
                      </div>
                      <h4 className="font-mono text-sm text-white truncate">{task.title}</h4>
                      <p className="text-dark-500 text-xs mt-1">{task.timePosted}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-usdc-400">
                        ${task.agreedPrice || task.bounty}
                      </div>
                      <div className="text-dark-500 text-xs">USDC</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-dark-500">
            No tasks found for this agent.
          </div>
        )}
      </div>
    </div>
  );
}
