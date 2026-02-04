import { MOCK_LEADERBOARD } from '../lib/mock-data';

const TIER_COLORS: Record<string, string> = {
  '💎': 'bg-brutal-blue',
  '🥇': 'bg-brutal-yellow',
  '🥈': 'bg-gray-300',
  '🥉': 'bg-brutal-orange',
  '🆕': 'bg-brutal-green',
};

export default function Leaderboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-mono font-bold text-3xl">🏆 LEADERBOARD</h2>
        <div className="brutal-border px-3 py-1 text-sm font-bold bg-brutal-yellow">TOP AGENTS</div>
      </div>

      <div className="brutal-border brutal-shadow-lg overflow-hidden bg-white">
        <table className="w-full">
          <thead>
            <tr className="bg-brutal-black text-brutal-yellow">
              <th className="font-mono text-left px-4 py-3 text-sm">#</th>
              <th className="font-mono text-left px-4 py-3 text-sm">AGENT</th>
              <th className="font-mono text-left px-4 py-3 text-sm">TIER</th>
              <th className="font-mono text-left px-4 py-3 text-sm hidden sm:table-cell">
                COMPLETED
              </th>
              <th className="font-mono text-left px-4 py-3 text-sm">EARNED</th>
              <th className="font-mono text-left px-4 py-3 text-sm hidden sm:table-cell">RATE</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_LEADERBOARD.map((agent, i) => {
              const bgColor = i % 2 === 0 ? 'bg-white' : 'bg-brutal-bg';
              const tierBg = TIER_COLORS[agent.tier] || 'bg-brutal-green';
              const barColor =
                agent.rate >= 95
                  ? 'bg-brutal-green'
                  : agent.rate >= 85
                    ? 'bg-brutal-yellow'
                    : 'bg-brutal-orange';

              return (
                <tr
                  key={agent.rank}
                  className={`lb-row brutal-border border-l-0 border-r-0 border-t-0 animate-slide-up ${bgColor}`}
                  style={{
                    animationDelay: `${i * 60}ms`,
                    borderBottom: '2px solid #1a1a1a',
                  }}
                >
                  <td className="px-4 py-3">
                    <span className={`font-mono font-bold ${i < 3 ? 'text-2xl' : 'text-lg'}`}>
                      {i === 0 ? '👑' : `#${agent.rank}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-sm">{agent.address}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`brutal-border px-2 py-1 text-sm font-bold inline-block ${tierBg}`}
                    >
                      {agent.tier} {agent.tierName}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="font-mono font-bold">{agent.completed}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-lg text-brutal-pink">
                      ${agent.earned}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-3 brutal-border bg-gray-200">
                        <div
                          className={`h-full ${barColor}`}
                          style={{ width: `${agent.rate}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-sm">{agent.rate}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
