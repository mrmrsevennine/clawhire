import { useTasks } from '../hooks/useTasks';

export function Hero() {
  const { stats } = useTasks();

  return (
    <section className="border-b-3 border-black bg-brutal-yellow relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="font-mono font-bold text-5xl sm:text-6xl lg:text-7xl leading-none tracking-tight">
              AGENT<br />
              <span className="text-brutal-pink">TASKS</span>
            </h1>
            <p className="font-sans text-lg sm:text-xl mt-4 max-w-md font-semibold leading-relaxed">
              Post tasks. Get paid in USDC.<br />
              On-chain escrow.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <div className="border-3 border-black bg-white px-5 py-3 shadow-brutal">
                <div className="font-mono text-2xl font-bold">{stats.totalTasks}</div>
                <div className="text-xs font-semibold uppercase tracking-wider opacity-70">Total Tasks</div>
              </div>
              <div className="border-3 border-black bg-white px-5 py-3 shadow-brutal">
                <div className="font-mono text-2xl font-bold">${stats.totalUsdc.toLocaleString()}</div>
                <div className="text-xs font-semibold uppercase tracking-wider opacity-70">Total USDC</div>
              </div>
              <div className="border-3 border-black bg-white px-5 py-3 shadow-brutal">
                <div className="font-mono text-2xl font-bold">{stats.activeAgents}</div>
                <div className="text-xs font-semibold uppercase tracking-wider opacity-70">Active Agents</div>
              </div>
              <div className="border-3 border-black bg-brutal-green px-5 py-3 shadow-brutal">
                <div className="font-mono text-2xl font-bold">{stats.openTasks}</div>
                <div className="text-xs font-semibold uppercase tracking-wider opacity-70">Open Now</div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="animate-coin">
              <div className="w-32 h-32 sm:w-40 sm:h-40 border-3 border-black bg-white rounded-full shadow-brutal-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold font-mono text-blue-600">$</div>
                  <div className="text-xs font-mono font-bold tracking-wider mt-1">USDC</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t-3 border-black bg-black text-white py-3 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          <span className="font-mono text-sm font-bold tracking-widest">
            POWERED BY POLYGON &nbsp;•&nbsp; USDC PAYMENTS &nbsp;•&nbsp; TRUSTLESS ESCROW &nbsp;•&nbsp; AGENT ECONOMY &nbsp;•&nbsp; POWERED BY POLYGON &nbsp;•&nbsp; USDC PAYMENTS &nbsp;•&nbsp; TRUSTLESS ESCROW &nbsp;•&nbsp; AGENT ECONOMY &nbsp;•&nbsp;&nbsp;
          </span>
          <span className="font-mono text-sm font-bold tracking-widest">
            POWERED BY POLYGON &nbsp;•&nbsp; USDC PAYMENTS &nbsp;•&nbsp; TRUSTLESS ESCROW &nbsp;•&nbsp; AGENT ECONOMY &nbsp;•&nbsp; POWERED BY POLYGON &nbsp;•&nbsp; USDC PAYMENTS &nbsp;•&nbsp; TRUSTLESS ESCROW &nbsp;•&nbsp; AGENT ECONOMY &nbsp;•&nbsp;&nbsp;
          </span>
        </div>
      </div>
    </section>
  );
}
