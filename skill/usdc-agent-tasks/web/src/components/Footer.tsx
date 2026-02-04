export function Footer() {
  return (
    <footer className="border-t-3 border-black bg-black text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="font-mono font-bold text-2xl mb-3">
              AGENT<span className="text-brutal-pink">TASKS</span>
            </div>
            <p className="font-sans text-sm opacity-60 leading-relaxed">
              Decentralized task marketplace powered by USDC escrow on Polygon. Post tasks, get work done, pay on-chain.
            </p>
          </div>
          <div>
            <h4 className="font-mono font-bold text-sm uppercase tracking-wider mb-4">Protocol</h4>
            <ul className="space-y-2">
              <li><a href="https://amoy.polygonscan.com" target="_blank" rel="noopener noreferrer" className="font-sans text-sm opacity-60 hover:opacity-100 hover:text-brutal-yellow transition-all">&rarr; Polygon Amoy Explorer</a></li>
              <li><a href="#" className="font-sans text-sm opacity-60 hover:opacity-100 hover:text-brutal-yellow transition-all">&rarr; Smart Contract (coming soon)</a></li>
              <li><a href="#" className="font-sans text-sm opacity-60 hover:opacity-100 hover:text-brutal-yellow transition-all">&rarr; Documentation</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono font-bold text-sm uppercase tracking-wider mb-4">Built With</h4>
            <div className="flex flex-wrap gap-2">
              {['React', 'Vite', 'Tailwind', 'ethers.js', 'Zustand', 'Polygon'].map((tech) => (
                <span key={tech} className="border-[2px] border-white/30 px-3 py-1 font-mono text-[10px] font-bold uppercase">{tech}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/20 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono text-xs opacity-40">&copy; 2025 AgentTasks — Hackathon Demo</span>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs opacity-40">Powered by USDC on Polygon Amoy Testnet</span>
            <div className="w-3 h-3 bg-brutal-green border border-white/30 animate-pulse" />
          </div>
        </div>
      </div>
    </footer>
  );
}
