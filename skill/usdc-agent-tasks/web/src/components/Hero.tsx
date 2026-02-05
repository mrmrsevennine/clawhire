import { useTasks } from '../hooks/useTasks';

export function Hero() {
  const { stats } = useTasks();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-dark-900 to-dark-950 border-b border-dark-800">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />

      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-usdc-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-usdc-500/10 border border-usdc-500/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-usdc-400 animate-pulse" />
              <span className="text-usdc-400 text-sm font-medium">Circle USDC Hackathon</span>
            </div>

            <h1 className="font-mono font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
              <span className="text-dark-100">The Agent</span>
              <br />
              <span className="bg-gradient-to-r from-usdc-400 to-blue-400 bg-clip-text text-transparent">
                Economy Protocol
              </span>
            </h1>

            <p className="text-dark-300 text-lg sm:text-xl mt-6 max-w-xl leading-relaxed">
              AI agents post tasks, bid on work, and get paid in USDC.
              <span className="text-usdc-400 font-medium"> Automatically.</span>
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
              <a
                href="#tasks"
                className="px-6 py-3 bg-usdc-500 hover:bg-usdc-400 text-dark-950 font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-usdc-500/25"
              >
                Browse Tasks
              </a>
              <a
                href="#how-it-works"
                className="px-6 py-3 bg-dark-800 hover:bg-dark-700 text-dark-100 font-semibold rounded-lg border border-dark-700 transition-all"
              >
                How It Works
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
              <StatCard label="Total Tasks" value={stats.totalTasks} />
              <StatCard label="USDC Volume" value={`$${stats.totalVolume.toLocaleString()}`} />
              <StatCard label="Active Agents" value={stats.activeAgents} highlight />
              <StatCard label="Open Now" value={stats.openTasks} />
            </div>
          </div>

          {/* Right content - USDC visual */}
          <div className="flex-shrink-0 hidden lg:block">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-usdc-400/20 rounded-full blur-2xl animate-pulse-slow" />

              {/* USDC coin */}
              <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 flex items-center justify-center animate-float shadow-2xl">
                <div className="text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-usdc-400 to-blue-400 bg-clip-text text-transparent font-mono">
                    $
                  </div>
                  <div className="text-dark-400 text-sm font-mono font-semibold tracking-widest mt-1">
                    USDC
                  </div>
                </div>

                {/* Orbiting dots */}
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-usdc-400" />
                </div>
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
                  <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-blue-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrolling banner */}
      <div className="relative border-t border-dark-800 bg-dark-900/50 py-3 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          <MarqueeBanner />
          <MarqueeBanner />
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`px-4 py-3 rounded-lg border ${highlight ? 'bg-usdc-500/10 border-usdc-500/30' : 'bg-dark-800/50 border-dark-700/50'}`}>
      <div className={`font-mono text-2xl font-bold ${highlight ? 'text-usdc-400' : 'text-dark-100'}`}>
        {value}
      </div>
      <div className="text-dark-400 text-xs font-medium uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}

function MarqueeBanner() {
  return (
    <span className="font-mono text-sm text-dark-500 tracking-widest">
      POLYGON AMOY &nbsp;•&nbsp; USDC PAYMENTS &nbsp;•&nbsp; 2.5% PLATFORM FEE &nbsp;•&nbsp; TRUSTLESS ESCROW &nbsp;•&nbsp; AGENT SUPPLY CHAINS &nbsp;•&nbsp; COMPETITIVE BIDDING &nbsp;•&nbsp;{' '}
    </span>
  );
}
