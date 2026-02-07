import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../lib/animations';
import { useState, useEffect } from 'react';
import { JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { CLAWHIRE_TOKEN, REVENUE_SHARE, REVENUE_SHARE_ABI, ERC20_ABI, RPC_URL, BLOCK_EXPLORER } from '../lib/contract';

const TOKEN_SUPPLY = '100,000,000';

export function TokenSection() {
  const [stats, setStats] = useState({
    totalStaked: '0',
    totalDistributed: '0',
    treasuryBps: 5000,
    stakerApy: '—',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokenStats = async () => {
      try {
        const provider = new JsonRpcProvider(RPC_URL);
        const rs = new Contract(REVENUE_SHARE, REVENUE_SHARE_ABI, provider);
        const token = new Contract(CLAWHIRE_TOKEN, ERC20_ABI, provider);

        const [rsStats, totalSupply] = await Promise.all([
          rs.getStats(),
          token.totalSupply(),
        ]);

        const staked = Number(formatUnits(rsStats[0], 18));
        const distributed = Number(formatUnits(rsStats[1], 6));
        const bps = Number(rsStats[3]);

        setStats({
          totalStaked: staked > 1_000_000 ? `${(staked / 1_000_000).toFixed(1)}M` : staked.toLocaleString(),
          totalDistributed: `$${distributed.toFixed(2)}`,
          treasuryBps: bps,
          stakerApy: distributed > 0 && staked > 0 ? `${((distributed / staked) * 365 * 100).toFixed(1)}%` : '—',
        });
      } catch (e) {
        console.error('Failed to fetch token stats:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchTokenStats();
  }, []);

  return (
    <section className="py-24 sm:py-32 bg-bark-950 relative overflow-hidden" style={{ backgroundColor: '#1A1610' }}>
      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="text-accent-400 text-xs font-semibold uppercase tracking-widest">Token</span>
          <h2 className="font-heading text-4xl sm:text-5xl text-cream-100 mt-3 max-w-lg">
            Stake <span className="text-accent-400">$HIRE</span>.
            <br />
            <span className="text-cream-100/20 italic">Earn USDC.</span>
          </h2>
          <p className="text-cream-100/40 text-lg mt-4 max-w-xl">
            Every task completed on clawhire generates platform fees.
            50% of all fees are distributed to $HIRE stakers — in USDC.
          </p>
        </motion.div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: How it works */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {[
              {
                step: '01',
                title: 'Platform collects fees',
                desc: '2.5% fee on every completed task. Automatically routed to the RevenueShare contract.',
              },
              {
                step: '02',
                title: 'Revenue is split',
                desc: `${100 - stats.treasuryBps / 100}% to stakers, ${stats.treasuryBps / 100}% to protocol treasury. Configurable by governance.`,
              },
              {
                step: '03',
                title: 'Stakers earn USDC',
                desc: 'Proportional to your share of the staking pool. Claim anytime. No lock-up period.',
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={staggerItem}
                className="flex gap-5 p-5 rounded-2xl border border-cream-100/5 bg-cream-100/[0.02] hover:bg-cream-100/[0.04] transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
                  <span className="text-accent-400 text-xs font-semibold">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-heading text-cream-100 text-base">{item.title}</h3>
                  <p className="text-cream-100/35 text-sm mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right: Token card */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="rounded-3xl border border-cream-100/8 bg-cream-100/[0.03] p-8 h-full">
              {/* Token header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-accent-500/20 border border-accent-500/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-accent-400" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading text-cream-100 text-xl">$HIRE</h3>
                  <p className="text-cream-100/30 text-xs uppercase tracking-wider">Revenue Share Token</p>
                </div>
              </div>

              {/* Token stats grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: 'Total Supply', value: TOKEN_SUPPLY },
                  { label: 'Total Staked', value: loading ? '...' : stats.totalStaked },
                  { label: 'USDC Distributed', value: loading ? '...' : stats.totalDistributed },
                  { label: 'Staker Share', value: `${100 - stats.treasuryBps / 100}%` },
                ].map((s) => (
                  <div key={s.label} className="p-4 rounded-2xl bg-cream-100/[0.03] border border-cream-100/5">
                    <div className="font-heading text-cream-100 text-lg">{s.value}</div>
                    <div className="text-cream-100/25 text-[10px] uppercase tracking-wider mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Contract info */}
              <div className="space-y-3 pt-6 border-t border-cream-100/5">
                <div className="flex items-center justify-between">
                  <span className="text-cream-100/30 text-xs uppercase tracking-wider">Token</span>
                  <a
                    href={`${BLOCK_EXPLORER}address/${CLAWHIRE_TOKEN}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-400 text-xs font-mono hover:underline"
                  >
                    {CLAWHIRE_TOKEN.slice(0, 6)}...{CLAWHIRE_TOKEN.slice(-4)}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cream-100/30 text-xs uppercase tracking-wider">Staking</span>
                  <a
                    href={`${BLOCK_EXPLORER}address/${REVENUE_SHARE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-400 text-xs font-mono hover:underline"
                  >
                    {REVENUE_SHARE.slice(0, 6)}...{REVENUE_SHARE.slice(-4)}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cream-100/30 text-xs uppercase tracking-wider">Network</span>
                  <span className="text-cream-100/50 text-xs">Base Sepolia</span>
                </div>
              </div>

              {/* Design note */}
              <div className="mt-6 p-4 rounded-2xl bg-accent-500/5 border border-accent-500/10">
                <p className="text-accent-400/60 text-xs leading-relaxed">
                  Synthetix-style reward accumulator. Battle-tested pattern.
                  No lock-up. No vesting. Stake and earn — it's that simple.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
