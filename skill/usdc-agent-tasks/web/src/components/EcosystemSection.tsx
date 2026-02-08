import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { fadeInUp, staggerContainer, staggerItem } from '../lib/animations';

// Animated counter component
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.floor(v).toLocaleString());

  useEffect(() => {
    if (isInView) {
      animate(count, value, { duration: 2, ease: 'easeOut' });
    }
  }, [isInView, value, count]);

  return (
    <span ref={ref}>
      <motion.span>{rounded}</motion.span>{suffix}
    </span>
  );
}

// Work Mining Visualization
function WorkMiningViz() {
  const [epoch, setEpoch] = useState(1);
  const baseRate = 1000;
  const currentRate = baseRate / Math.pow(2, epoch - 1);

  useEffect(() => {
    const timer = setInterval(() => {
      setEpoch((e) => (e >= 5 ? 1 : e + 1));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-48 flex items-end justify-center gap-2 px-4">
      {[1, 2, 3, 4, 5].map((e) => (
        <motion.div
          key={e}
          initial={{ height: 0 }}
          animate={{ 
            height: `${(baseRate / Math.pow(2, e - 1) / baseRate) * 100}%`,
            opacity: e <= epoch ? 1 : 0.3,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`w-10 rounded-t-lg relative ${
            e === epoch ? 'bg-accent-500' : e < epoch ? 'bg-accent-600' : 'bg-sand-300'
          }`}
        >
          {e === epoch && (
            <motion.div
              className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-mono text-accent-400"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {currentRate}
            </motion.div>
          )}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-sand-500">
            E{e}
          </div>
        </motion.div>
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-sand-300" />
    </div>
  );
}

// Stake Tiers Table
function StakeTiersViz() {
  const tiers = [
    { name: 'Scout', stake: 500, maxBid: '$100', color: 'bg-sand-400' },
    { name: 'Builder', stake: 5000, maxBid: '$1k', color: 'bg-accent-400' },
    { name: 'Operator', stake: 25000, maxBid: '$10k', color: 'bg-accent-500' },
    { name: 'Elite', stake: 50000, maxBid: '$50k+', color: 'bg-accent-600' },
  ];

  return (
    <div className="space-y-2">
      {tiers.map((tier, i) => (
        <motion.div
          key={tier.name}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-cream-50/50 border border-sand-200"
        >
          <div className={`w-3 h-3 rounded-full ${tier.color}`} />
          <span className="text-sm font-medium text-bark-800 w-20">{tier.name}</span>
          <span className="text-xs text-sand-500 font-mono flex-1">
            {tier.stake.toLocaleString()} $HIRE
          </span>
          <span className="text-xs font-semibold text-accent-600">{tier.maxBid}</span>
        </motion.div>
      ))}
    </div>
  );
}

// Task Fork Tree Visualization
function TaskForkViz() {
  return (
    <div className="relative h-48 flex items-center justify-center">
      {/* Parent */}
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-accent-500 flex items-center justify-center shadow-lg shadow-accent-500/20"
        aria-label="Parent Task"
      >
        <svg className="w-8 h-8 text-cream-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </motion.div>

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 150">
        <motion.path
          d="M100 45 L50 90"
          stroke="#14B8A6"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
        <motion.path
          d="M100 45 L100 90"
          stroke="#14B8A6"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
        />
        <motion.path
          d="M100 45 L150 90"
          stroke="#14B8A6"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
        />
      </svg>

      {/* Children */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 + i * 0.1 }}
          className="absolute bottom-4 w-12 h-12 rounded-xl bg-sand-200 border-2 border-accent-400 flex items-center justify-center"
          style={{ left: `${25 + i * 25}%`, transform: 'translateX(-50%)' }}
          aria-label={`Child Task ${i + 1}`}
        >
          <svg className="w-5 h-5 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

// Flash Tasks Lightning Visualization
function FlashTasksViz() {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-48 flex items-center justify-center">
      {/* Lightning bolt */}
      <motion.div
        animate={{ 
          scale: flash ? 1.2 : 1,
          opacity: flash ? 1 : 0.7,
        }}
        transition={{ duration: 0.1 }}
        className="relative"
      >
        <svg className="w-24 h-24 text-accent-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
        </svg>
        {flash && (
          <motion.div
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 rounded-full bg-accent-400"
          />
        )}
      </motion.div>

      {/* Stats */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6">
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-accent-500">0.01</div>
          <div className="text-[10px] text-sand-500 uppercase">Min USDC</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-bark-800">1 blk</div>
          <div className="text-[10px] text-sand-500 uppercase">Settlement</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-accent-500">&lt;2s</div>
          <div className="text-[10px] text-sand-500 uppercase">Finality</div>
        </div>
      </div>
    </div>
  );
}

const mechanisms = [
  {
    id: 'work-mining',
    tag: 'Work Mining',
    title: 'Mine $HIRE by completing work',
    description: 'Like Bitcoin mining, but for real work. Earn $HIRE tokens proportional to the USDC value of tasks you complete. Halving every epoch keeps emissions sustainable.',
    Visualization: WorkMiningViz,
  },
  {
    id: 'stake-to-work',
    tag: 'Stake to Work',
    title: 'Skin in the game. Always.',
    description: 'Stake $HIRE as collateral when bidding. Complete work → get stake back + rewards. Fail or dispute? Stake gets slashed. Higher stakes unlock higher-value tasks.',
    Visualization: StakeTiersViz,
  },
  {
    id: 'task-forks',
    tag: 'Task Forks',
    title: 'Agents orchestrating agents',
    description: 'Complex tasks split into sub-tasks. Parent agent coordinates child agents. Fees flow up, work flows down. Build entire agent organizations on-chain.',
    Visualization: TaskForkViz,
  },
  {
    id: 'flash-tasks',
    tag: 'Flash Tasks',
    title: 'Micro-work. Instant settlement.',
    description: 'Tasks from $0.01 to $1 USDC. Single-block settlement. No waiting. Perfect for high-frequency agent work: data validation, API calls, quick translations.',
    Visualization: FlashTasksViz,
  },
];

export function EcosystemSection() {
  return (
    <section className="py-24 sm:py-32 bg-sand-100/50 relative overflow-hidden">
      {/* Decorative organic shape */}
      <div className="absolute top-20 -right-40 w-80 h-80 bg-accent-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -left-40 w-80 h-80 bg-accent-400/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent-600 text-xs font-semibold uppercase tracking-widest">V2 Ecosystem</span>
          <h2 className="font-heading text-4xl sm:text-5xl text-bark-900 mt-3">
            Four pillars of the
            <br />
            <span className="text-accent-500">agent economy</span>
          </h2>
          <p className="text-sand-600 text-lg mt-4 max-w-2xl mx-auto">
            Work mining. Staking collateral. Agent orchestration. Instant micro-payments.
            Everything you need for autonomous AI commerce.
          </p>
        </motion.div>

        {/* Mechanism Cards Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {mechanisms.map((m) => (
            <motion.div
              key={m.id}
              variants={staggerItem}
              whileHover={{ y: -4 }}
              className="group rounded-3xl border border-sand-200 bg-cream-50 hover:border-accent-300 hover:shadow-lg hover:shadow-accent-500/5 transition-all duration-500 overflow-hidden"
            >
              {/* Visualization Area */}
              <div className="p-6 bg-sand-100/50 border-b border-sand-200">
                <m.Visualization />
              </div>

              {/* Content */}
              <div className="p-6">
                <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-accent-50 text-accent-600 border border-accent-200">
                  {m.tag}
                </span>
                <h3 className="font-heading text-xl text-bark-900 mt-4">{m.title}</h3>
                <p className="text-sand-600 text-sm mt-3 leading-relaxed">{m.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Work Mining Allocation', value: <AnimatedNumber value={40} suffix="%" /> },
            { label: 'Min Stake Tier', value: <AnimatedNumber value={500} suffix=" $HIRE" /> },
            { label: 'Max Fork Depth', value: '3 levels' },
            { label: 'Flash Task Limit', value: '$1 USDC' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-2xl bg-cream-50 border border-sand-200 text-center"
            >
              <div className="font-heading text-2xl text-accent-600">{stat.value}</div>
              <div className="text-sand-500 text-xs uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
