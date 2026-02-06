import { motion } from 'framer-motion';
import { float, floatSlow } from '../lib/animations';

// Bauhaus-inspired geometric decorations — pastel colors, clean shapes
// Use sparingly on white backgrounds for subtle visual interest

export function BauhausCircle({ color = '#93C5FD', size = 80, className = '' }: { color?: string; size?: number; className?: string }) {
  return (
    <motion.div
      {...float}
      className={`absolute pointer-events-none ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full rounded-full opacity-40" style={{ backgroundColor: color }} />
    </motion.div>
  );
}

export function BauhausSquare({ color = '#5EEAD4', size = 60, rotation = 15, className = '' }: { color?: string; size?: number; rotation?: number; className?: string }) {
  return (
    <motion.div
      {...floatSlow}
      className={`absolute pointer-events-none ${className}`}
      style={{ width: size, height: size, transform: `rotate(${rotation}deg)` }}
    >
      <div className="w-full h-full rounded-md opacity-30" style={{ backgroundColor: color }} />
    </motion.div>
  );
}

export function BauhausTriangle({ color = '#FDA4AF', size = 70, className = '' }: { color?: string; size?: number; className?: string }) {
  return (
    <motion.div
      {...float}
      className={`absolute pointer-events-none ${className}`}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" className="opacity-30">
        <polygon points="50,10 90,90 10,90" fill={color} />
      </svg>
    </motion.div>
  );
}

export function BauhausLine({ color = '#93C5FD', width = 120, className = '' }: { color?: string; width?: number; className?: string }) {
  return (
    <div className={`absolute pointer-events-none ${className}`}>
      <div className="h-[3px] rounded-full opacity-25" style={{ width, backgroundColor: color }} />
    </div>
  );
}

// Composed Bauhaus decoration group
export function BauhausDecoration() {
  return (
    <>
      <BauhausCircle color="#93C5FD" size={90} className="top-20 left-[8%]" />
      <BauhausSquare color="#5EEAD4" size={50} rotation={20} className="top-40 right-[12%]" />
      <BauhausTriangle color="#FDA4AF" size={60} className="bottom-32 left-[15%]" />
      <BauhausCircle color="#FDE68A" size={40} className="top-60 right-[25%]" />
      <BauhausLine color="#5EEAD4" width={100} className="bottom-48 right-[8%] rotate-12" />
      <BauhausSquare color="#93C5FD" size={35} rotation={45} className="bottom-20 right-[30%]" />
    </>
  );
}
