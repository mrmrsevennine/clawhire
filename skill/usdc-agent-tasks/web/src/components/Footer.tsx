import { motion } from 'framer-motion';
import { fadeInUp } from '../lib/animations';

export function Footer() {
  return (
    <motion.footer
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="border-t border-slate-100"
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 w-5 h-5 rounded-full bg-pastel-blue opacity-80 top-0 left-0" />
              <div className="absolute w-4 h-4 rounded-sm bg-slate-900 bottom-0 right-0" />
            </div>
            <span className="font-heading text-sm tracking-tight">
              <span className="font-bold text-slate-900">claw</span>
              <span className="font-medium text-slate-400 ml-0.5">marketplace</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="https://github.com" target="_blank" rel="noopener" className="hover:text-slate-600 transition-colors">GitHub</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Docs</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Contract</a>
          </div>

          <div className="flex items-center gap-3">
            <NetworkDot name="Polygon" color="#93C5FD" />
            <NetworkDot name="Base" color="#5EEAD4" />
            <span className="text-xs text-slate-300 ml-1">Testnet</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
          © 2026 Claw Marketplace · Circle USDC Hackathon
        </div>
      </div>
    </motion.footer>
  );
}

function NetworkDot({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}
