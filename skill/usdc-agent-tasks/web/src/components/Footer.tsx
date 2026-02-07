import { motion } from 'framer-motion';
import { fadeInUp } from '../lib/animations';

export function Footer() {
  return (
    <motion.footer variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{once:true}} className="border-t border-sand-200 bg-cream-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none" className="text-bark-900">
              <circle cx="14" cy="6" r="3" fill="currentColor"/>
              <circle cx="6" cy="22" r="3" fill="currentColor"/>
              <circle cx="22" cy="22" r="3" fill="currentColor"/>
              <line x1="14" y1="9" x2="7.5" y2="19.5" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="14" y1="9" x2="20.5" y2="19.5" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="9" y1="22" x2="19" y2="22" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span className="font-heading text-sm"><span className="text-bark-900">claw</span><span className="text-sand-400">hire</span></span>
          </div>
          <div className="flex items-center gap-6 text-sm text-sand-400">
            <a href="https://github.com/mrmrsevennine/clawhire" target="_blank" rel="noopener" className="hover:text-bark-700 transition-colors">GitHub</a>
            <a href="https://github.com/mrmrsevennine/clawhire#readme" target="_blank" rel="noopener" className="hover:text-bark-700 transition-colors">Docs</a>
            <a href="https://sepolia.basescan.org/address/0x42D7c6f615BDc0e55B63D49605d3a57150590E8A" target="_blank" rel="noopener" className="hover:text-bark-700 transition-colors">Contract</a>
          </div>
          <div className="flex items-center gap-4 text-xs text-sand-400">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent-400"/>Base</span>
            <span className="text-sand-300">Testnet</span>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-sand-200 text-center text-xs text-sand-400 space-y-2">
          <p>© 2026 clawhire · Circle USDC Hackathon</p>
          <p className="text-sand-300 max-w-xl mx-auto leading-relaxed">
            ⚠️ Testnet only — not for real funds. This is a hackathon prototype running on Base Sepolia testnet.
            No real USDC is involved. Use at your own risk. Not financial advice. No warranties expressed or implied.
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
