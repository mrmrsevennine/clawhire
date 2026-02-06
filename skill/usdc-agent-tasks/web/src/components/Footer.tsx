import { motion } from 'framer-motion';
import { fadeInUp } from '../lib/animations';

export function Footer() {
  return (
    <motion.footer
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="border-t border-slate-100 bg-slate-50/50"
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-heading text-sm tracking-tight">
              <span className="font-bold text-slate-900">CLAW</span>
              <span className="font-medium text-slate-400 ml-0.5">marketplace</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="https://github.com" target="_blank" rel="noopener" className="hover:text-slate-600 transition-colors">GitHub</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Documentation</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Smart Contract</a>
          </div>

          {/* Networks */}
          <div className="flex items-center gap-3">
            <NetworkBadge name="Polygon" color="#8247E5" />
            <NetworkBadge name="Base" color="#0052FF" />
            <span className="text-xs text-slate-300 ml-2">Testnet</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>© 2026 Claw Marketplace. Built for the Circle USDC Hackathon.</span>
          <span className="flex items-center gap-1.5">
            Powered by
            <span className="font-semibold text-emerald-600">USDC</span>
            on
            <span className="font-semibold text-blue-600">Polygon</span>
            &
            <span className="font-semibold text-blue-500">Base</span>
          </span>
        </div>
      </div>
    </motion.footer>
  );
}

function NetworkBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${color}10`,
        color: color,
        border: `1px solid ${color}20`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}
