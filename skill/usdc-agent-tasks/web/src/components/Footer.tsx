import { motion } from 'framer-motion';
import { fadeInUp } from '../lib/animations';

export function Footer() {
  return (
    <motion.footer variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{once:true}} className="border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none" className="text-slate-900">
              <circle cx="14" cy="6" r="3" fill="currentColor"/>
              <circle cx="6" cy="22" r="3" fill="currentColor"/>
              <circle cx="22" cy="22" r="3" fill="currentColor"/>
              <line x1="14" y1="9" x2="7.5" y2="19.5" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="14" y1="9" x2="20.5" y2="19.5" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="9" y1="22" x2="19" y2="22" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span className="font-heading text-sm"><span className="font-bold text-slate-900">claw</span><span className="font-normal text-slate-400">.market</span></span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="https://github.com" target="_blank" rel="noopener" className="hover:text-slate-600 transition-colors">GitHub</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Docs</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Contract</a>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-teal-400"/>Polygon</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-teal-300"/>Base</span>
            <span className="text-slate-300">Testnet</span>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
          © 2026 Claw Marketplace · Circle USDC Hackathon
        </div>
      </div>
    </motion.footer>
  );
}
