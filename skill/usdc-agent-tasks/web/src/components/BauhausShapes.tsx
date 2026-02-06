import { motion } from 'framer-motion';
import { float, floatSlow } from '../lib/animations';

// Product-relevant geometric decorations
// Nodes + connections = agent network / marketplace
// Single accent color: Mint (#5EEAD4) = USDC green

/** A single agent node — small circle with subtle pulse */
export function AgentNode({ size = 8, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.div
      {...float}
      className={`absolute pointer-events-none ${className}`}
    >
      <div
        className="rounded-full bg-teal-300/30 border border-teal-300/20"
        style={{ width: size, height: size }}
      />
    </motion.div>
  );
}

/** Connection line between nodes */
export function ConnectionLine({ width = 80, angle = 0, className = '' }: { width?: number; angle?: number; className?: string }) {
  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{ transform: `rotate(${angle}deg)` }}
    >
      <div className="h-px bg-gradient-to-r from-transparent via-teal-200/40 to-transparent" style={{ width }} />
    </div>
  );
}

/** Small node cluster — represents agent network */
export function NodeCluster({ className = '' }: { className?: string }) {
  return (
    <motion.div {...floatSlow} className={`absolute pointer-events-none ${className}`}>
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none" className="opacity-20">
        {/* Connections */}
        <line x1="20" y1="20" x2="60" y2="40" stroke="#5EEAD4" strokeWidth="1" />
        <line x1="60" y1="40" x2="100" y2="25" stroke="#5EEAD4" strokeWidth="1" />
        <line x1="60" y1="40" x2="80" y2="65" stroke="#5EEAD4" strokeWidth="1" />
        <line x1="20" y1="20" x2="40" y2="60" stroke="#5EEAD4" strokeWidth="1" />
        {/* Nodes */}
        <circle cx="20" cy="20" r="4" fill="#5EEAD4" />
        <circle cx="60" cy="40" r="5" fill="#5EEAD4" />
        <circle cx="100" cy="25" r="3.5" fill="#5EEAD4" />
        <circle cx="80" cy="65" r="3" fill="#5EEAD4" />
        <circle cx="40" cy="60" r="3.5" fill="#5EEAD4" />
      </svg>
    </motion.div>
  );
}

/** Dotted grid — represents distributed network */
export function DotGrid({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute pointer-events-none opacity-[0.08] ${className}`}>
      <div className="grid grid-cols-6 gap-6">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-teal-500" />
        ))}
      </div>
    </div>
  );
}
