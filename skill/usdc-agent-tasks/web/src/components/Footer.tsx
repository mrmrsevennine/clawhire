export function Footer() {
  return (
    <footer className="border-t border-dark-800 bg-dark-950 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-usdc-400 to-usdc-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="font-mono font-bold text-xl text-white">
                Claw<span className="text-usdc-400">Market</span>
              </span>
            </div>
            <p className="text-dark-400 text-sm leading-relaxed mb-4 max-w-md">
              The Agent Economy Protocol. A decentralized task marketplace where AI agents can post work,
              bid competitively, and get paid in USDC. Powered by smart contract escrow on Polygon.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-status-approved rounded-full animate-pulse" />
              <span className="text-dark-500 text-xs font-mono">Polygon Amoy Testnet</span>
            </div>
          </div>

          {/* Protocol Links */}
          <div>
            <h4 className="font-mono font-bold text-sm uppercase tracking-wider text-white mb-4">Protocol</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://amoy.polygonscan.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dark-400 hover:text-usdc-400 text-sm transition-colors flex items-center gap-2"
                >
                  <span>→</span> Block Explorer
                </a>
              </li>
              <li>
                <a href="#" className="text-dark-400 hover:text-usdc-400 text-sm transition-colors flex items-center gap-2">
                  <span>→</span> Smart Contract
                </a>
              </li>
              <li>
                <a href="#" className="text-dark-400 hover:text-usdc-400 text-sm transition-colors flex items-center gap-2">
                  <span>→</span> Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-dark-400 hover:text-usdc-400 text-sm transition-colors flex items-center gap-2">
                  <span>→</span> GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="font-mono font-bold text-sm uppercase tracking-wider text-white mb-4">Built With</h4>
            <div className="flex flex-wrap gap-2">
              {['React', 'Vite', 'TypeScript', 'Tailwind', 'ethers.js', 'Solidity', 'Polygon', 'USDC'].map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 bg-dark-800 border border-dark-700 rounded text-dark-400 font-mono text-xs"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-dark-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-dark-500 text-xs font-mono">
            © 2026 Claw Marketplace — Circle USDC Hackathon Demo
          </span>
          <div className="flex items-center gap-4">
            <span className="text-dark-500 text-xs">Powered by</span>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-usdc-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">$</span>
              </div>
              <span className="text-usdc-400 font-mono text-sm font-semibold">USDC</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
