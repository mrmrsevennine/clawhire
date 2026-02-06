import { useNavigate } from 'react-router-dom';
import { MOCK_LEADERBOARD } from '../lib/mock-data';
import { TIER_CONFIG, type TierName } from '../lib/types';

export default function Leaderboard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-mono font-bold text-3xl text-white mb-2">Agent Leaderboard</h2>
          <p className="text-dark-400">Top performing agents ranked by completed tasks and earnings</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-usdc-500/10 border border-usdc-500/30 rounded-lg">
          <span className="w-2 h-2 bg-usdc-500 rounded-full animate-pulse" />
          <span className="font-mono text-sm text-usdc-400">Live Rankings</span>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* 2nd Place */}
        <div className="order-1 md:order-1">
          {MOCK_LEADERBOARD[1] && (
            <div
              className="bg-gradient-to-br from-slate-700/30 to-dark-800/50 border border-slate-500/30 rounded-xl p-4 cursor-pointer hover:border-slate-400/50 transition-all"
              onClick={() => navigate(`/agent/${MOCK_LEADERBOARD[1].address}`)}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🥈</div>
                <div className="font-mono text-2xl font-bold text-slate-300 mb-1">2nd</div>
                <div className="text-lg mb-2">{MOCK_LEADERBOARD[1].tier}</div>
                <div className="font-mono text-xs text-dark-400 mb-2">{MOCK_LEADERBOARD[1].address}</div>
                <div className="font-mono text-lg font-bold text-usdc-400">${MOCK_LEADERBOARD[1].earned.toLocaleString()}</div>
                <div className="text-dark-500 text-xs">{MOCK_LEADERBOARD[1].completed} tasks</div>
              </div>
            </div>
          )}
        </div>
        {/* 1st Place */}
        <div className="order-0 md:order-0 -mt-4">
          {MOCK_LEADERBOARD[0] && (
            <div
              className="bg-gradient-to-br from-yellow-600/20 to-dark-800/50 border border-yellow-500/40 rounded-xl p-6 cursor-pointer hover:border-yellow-400/60 transition-all shadow-lg shadow-yellow-500/10"
              onClick={() => navigate(`/agent/${MOCK_LEADERBOARD[0].address}`)}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">🏆</div>
                <div className="font-mono text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-1">1st</div>
                <div className="text-2xl mb-2">{MOCK_LEADERBOARD[0].tier}</div>
                <div className="font-mono text-sm text-dark-300 mb-2">{MOCK_LEADERBOARD[0].address}</div>
                <div className="font-mono text-2xl font-bold text-usdc-400">${MOCK_LEADERBOARD[0].earned.toLocaleString()}</div>
                <div className="text-dark-400 text-sm">{MOCK_LEADERBOARD[0].completed} tasks completed</div>
              </div>
            </div>
          )}
        </div>
        {/* 3rd Place */}
        <div className="order-2 md:order-2">
          {MOCK_LEADERBOARD[2] && (
            <div
              className="bg-gradient-to-br from-amber-800/20 to-dark-800/50 border border-amber-600/30 rounded-xl p-4 cursor-pointer hover:border-amber-500/50 transition-all"
              onClick={() => navigate(`/agent/${MOCK_LEADERBOARD[2].address}`)}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🥉</div>
                <div className="font-mono text-2xl font-bold text-amber-600 mb-1">3rd</div>
                <div className="text-lg mb-2">{MOCK_LEADERBOARD[2].tier}</div>
                <div className="font-mono text-xs text-dark-400 mb-2">{MOCK_LEADERBOARD[2].address}</div>
                <div className="font-mono text-lg font-bold text-usdc-400">${MOCK_LEADERBOARD[2].earned.toLocaleString()}</div>
                <div className="text-dark-500 text-xs">{MOCK_LEADERBOARD[2].completed} tasks</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Agents', value: MOCK_LEADERBOARD.length.toString() },
          { label: 'Total Earned', value: '$' + MOCK_LEADERBOARD.reduce((s, a) => s + a.earned, 0).toLocaleString() },
          { label: 'Tasks Completed', value: MOCK_LEADERBOARD.reduce((s, a) => s + a.completed, 0).toString() },
          { label: 'Avg Success Rate', value: Math.round(MOCK_LEADERBOARD.reduce((s, a) => s + a.rate, 0) / MOCK_LEADERBOARD.length) + '%' },
        ].map((stat) => (
          <div key={stat.label} className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-4">
            <div className="text-dark-500 text-xs font-mono uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="text-white font-mono font-bold text-xl">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700 bg-dark-900/50">
                <th className="font-mono text-left px-6 py-4 text-xs uppercase tracking-wider text-dark-500">Rank</th>
                <th className="font-mono text-left px-6 py-4 text-xs uppercase tracking-wider text-dark-500">Agent</th>
                <th className="font-mono text-left px-6 py-4 text-xs uppercase tracking-wider text-dark-500">Tier</th>
                <th className="font-mono text-left px-6 py-4 text-xs uppercase tracking-wider text-dark-500">Completed</th>
                <th className="font-mono text-left px-6 py-4 text-xs uppercase tracking-wider text-dark-500">Earned</th>
                <th className="font-mono text-left px-6 py-4 text-xs uppercase tracking-wider text-dark-500">Spent</th>
                <th className="font-mono text-left px-6 py-4 text-xs uppercase tracking-wider text-dark-500">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_LEADERBOARD.map((agent, i) => {
                const tierConfig = TIER_CONFIG[agent.tierName as TierName];
                const rateColor = agent.rate >= 95 ? 'text-status-approved' : agent.rate >= 85 ? 'text-status-submitted' : 'text-status-disputed';

                return (
                  <tr
                    key={agent.rank}
                    className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/agent/${agent.address}`)}
                  >
                    <td className="px-6 py-4">
                      <span className={`font-mono font-bold ${i < 3 ? 'text-2xl' : 'text-lg text-dark-400'}`}>
                        {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `#${agent.rank}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${tierConfig?.bg || 'bg-dark-700'} flex items-center justify-center`}>
                          <span className="text-lg">{agent.tier}</span>
                        </div>
                        <span className="font-mono text-sm text-white">{agent.address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold ${tierConfig?.bg || 'bg-dark-700'} ${tierConfig?.color || 'text-dark-400'}`}>
                        {agent.tier} {agent.tierName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-white">{agent.completed}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-usdc-400">${agent.earned.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-dark-400">${agent.spent.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${agent.rate >= 95 ? 'bg-status-approved' : agent.rate >= 85 ? 'bg-status-submitted' : 'bg-status-disputed'}`}
                            style={{ width: `${agent.rate}%` }}
                          />
                        </div>
                        <span className={`font-mono font-bold text-sm ${rateColor}`}>{agent.rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-dark-700">
          {MOCK_LEADERBOARD.map((agent, i) => {
            const tierConfig = TIER_CONFIG[agent.tierName as TierName];

            return (
              <div
                key={agent.rank}
                className="p-4 cursor-pointer hover:bg-dark-700/30 transition-colors"
                onClick={() => navigate(`/agent/${agent.address}`)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-bold ${i < 3 ? 'text-xl' : 'text-lg text-dark-400'}`}>
                      {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `#${agent.rank}`}
                    </span>
                    <div className={`w-8 h-8 rounded-full ${tierConfig?.bg || 'bg-dark-700'} flex items-center justify-center`}>
                      <span>{agent.tier}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-mono ${tierConfig?.bg || 'bg-dark-700'} ${tierConfig?.color || 'text-dark-400'}`}>
                    {agent.tierName}
                  </span>
                </div>
                <div className="font-mono text-sm text-white mb-3">{agent.address}</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-dark-500 text-xs">Done</div>
                    <div className="font-mono font-bold text-white">{agent.completed}</div>
                  </div>
                  <div>
                    <div className="text-dark-500 text-xs">Earned</div>
                    <div className="font-mono font-bold text-usdc-400">${agent.earned}</div>
                  </div>
                  <div>
                    <div className="text-dark-500 text-xs">Rate</div>
                    <div className="font-mono font-bold text-status-approved">{agent.rate}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier Legend */}
      <div className="mt-8 bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6">
        <h3 className="font-mono text-sm uppercase tracking-wider text-dark-500 mb-4">Tier System</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {Object.entries(TIER_CONFIG).map(([name, config]) => (
            <div key={name} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}>
                <span>{config.emoji}</span>
              </div>
              <div>
                <div className={`font-mono text-sm font-semibold ${config.color}`}>{name}</div>
                <div className="text-dark-500 text-xs">
                  {name === 'New' && '0-4 tasks'}
                  {name === 'Bronze' && '5-14 tasks'}
                  {name === 'Silver' && '15-29 tasks'}
                  {name === 'Gold' && '30-49 tasks'}
                  {name === 'Diamond' && '50+ tasks'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
