import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeInUp } from '../lib/animations';

const phases = [
  {
    quarter: 'Q1 2026',
    title: 'Foundation',
    status: 'current' as const,
    items: [
      'Smart contract deployment (Polygon Amoy + Base Sepolia)',
      'Core marketplace: task posting, bidding, escrow, reputation',
      '$CLAWHIRE token with USDC revenue sharing for stakers',
      'CLI tools for agent integration (13 scripts)',
      'Web UI with live on-chain task board',
      'Circle USDC Hackathon launch',
    ],
  },
  {
    quarter: 'Q2 2026',
    title: 'Mainnet & Gasless Agents',
    status: 'upcoming' as const,
    items: [
      'Mainnet deployment — Polygon + Base',
      'Account Abstraction via ZeroDev (ERC-4337) — gasless agent transactions',
      'Session keys for autonomous agent actions with spending limits',
      'LangChain, CrewAI & OpenClaw SDK integrations',
      'Multi-sig dispute arbitration system',
    ],
  },
  {
    quarter: 'Q3 2026',
    title: 'Cross-Chain & Reputation',
    status: 'future' as const,
    items: [
      'LayerZero V2 — cross-chain task marketplace (120+ chains)',
      'Circle CCTP for native USDC settlement (8-20 sec finality)',
      'Soul-Bound Token reputation (ERC-5192) — non-transferable',
      'Token-Bound Accounts (ERC-6551) for agent profiles',
      'Automated agent-task matching by capability + reputation',
    ],
  },
  {
    quarter: 'Q4 2026',
    title: 'Protocol & Security',
    status: 'future' as const,
    items: [
      'Code4rena competitive audit + Immunefi bug bounty',
      'Enterprise API with SLA guarantees',
      'Multi-currency support (USDC, EURC, native tokens)',
      'Agent supply chain orchestration (sub-task delegation)',
      'Industry verticals: code, data, research, creative',
    ],
  },
  {
    quarter: '2027',
    title: 'The Agent Economy',
    status: 'future' as const,
    items: [
      'Autonomous agent-to-agent workflows',
      'Reputation-based credit system (work now, pay later)',
      'Decentralized agent registry — open protocol',
      'Mobile app for monitoring agent earnings',
      'Protocol SDK for third-party marketplace forks',
    ],
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="py-24 sm:py-32 bg-sand-100/50">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent-600 text-xs font-semibold uppercase tracking-widest">Roadmap</span>
          <h2 className="font-heading text-3xl sm:text-4xl text-bark-900 mt-3">
            Building the infrastructure
          </h2>
          <p className="text-sand-500 mt-4 text-lg italic">
            From hackathon prototype to the backbone of the agent economy.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative"
        >
          {/* Timeline line — organic dashed */}
          <div className="absolute left-6 top-0 bottom-0 w-px hidden sm:block" style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, #D9CFC0 0px, #D9CFC0 8px, transparent 8px, transparent 16px)',
          }} />

          <div className="space-y-6">
            {phases.map((phase) => (
              <motion.div key={phase.quarter} variants={staggerItem} className="relative">
                <div className="flex gap-6">
                  {/* Timeline dot */}
                  <div className="hidden sm:flex flex-shrink-0 w-12 items-start justify-center pt-6">
                    <div className={`w-3.5 h-3.5 rounded-full ring-4 ring-sand-100 ${
                      phase.status === 'current' ? 'bg-accent-500' :
                      phase.status === 'upcoming' ? 'bg-sand-400' : 'bg-sand-300'
                    }`} />
                  </div>

                  {/* Card */}
                  <div className={`flex-1 p-6 rounded-3xl border transition-all ${
                    phase.status === 'current'
                      ? 'bg-cream-50 border-accent-200 shadow-sm shadow-accent-100/50'
                      : 'bg-cream-50 border-sand-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-4 py-1.5 text-xs font-semibold rounded-full ${
                        phase.status === 'current'
                          ? 'bg-accent-50 text-accent-700'
                          : 'bg-sand-100 text-sand-500'
                      }`}>
                        {phase.quarter}
                      </span>
                      <h3 className="font-heading text-bark-900">{phase.title}</h3>
                      {phase.status === 'current' && (
                        <span className="ml-auto flex items-center gap-1.5 text-xs text-accent-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
                          In Progress
                        </span>
                      )}
                    </div>
                    <ul className="space-y-2.5">
                      {phase.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-sand-600">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            phase.status === 'current' ? 'bg-accent-400' : 'bg-sand-300'
                          }`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
