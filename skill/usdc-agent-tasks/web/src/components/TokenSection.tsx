import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../lib/animations';
import { useState, useEffect, useCallback, useRef } from 'react';
import { JsonRpcProvider, BrowserProvider, Contract, formatUnits, parseUnits, MaxUint256 } from 'ethers';
import { CLAWHIRE_TOKEN, REVENUE_SHARE, REVENUE_SHARE_ABI, ERC20_ABI, RPC_URL, BLOCK_EXPLORER } from '../lib/contract';
import { useWallet } from '../hooks/useWallet';

const TOKEN_SUPPLY = '100,000,000';

// Animated counter for numbers
function AnimatedCounter({ value, decimals = 0, prefix = '', suffix = '' }: { 
  value: number; 
  decimals?: number; 
  prefix?: string; 
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => 
    `${prefix}${v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
  );

  useEffect(() => {
    if (isInView) {
      animate(count, value, { duration: 2, ease: 'easeOut' });
    }
  }, [isInView, value, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

// Token Distribution Chart
function TokenDistributionChart() {
  const distribution = [
    { label: 'Work Mining', value: 40, color: 'bg-accent-500' },
    { label: 'Treasury', value: 25, color: 'bg-accent-600' },
    { label: 'Staking Rewards', value: 15, color: 'bg-accent-400' },
    { label: 'Team', value: 10, color: 'bg-sand-400' },
    { label: 'Community', value: 10, color: 'bg-sand-300' },
  ];

  return (
    <div className="space-y-3">
      {distribution.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="flex justify-between text-xs mb-1">
            <span className="text-cream-100/60">{item.label}</span>
            <span className="text-cream-100 font-mono">{item.value}%</span>
          </div>
          <div className="h-2 rounded-full bg-cream-100/5 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${item.color}`}
              initial={{ width: 0 }}
              whileInView={{ width: `${item.value}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Fee Split Visualization
function FeeSplitViz() {
  const splits = [
    { label: 'Staker Yield', value: 50, amount: '1.25%', color: 'bg-accent-500' },
    { label: 'Treasury', value: 30, amount: '0.75%', color: 'bg-accent-600' },
    { label: 'Burn 🔥', value: 20, amount: '0.5%', color: 'bg-orange-500' },
  ];

  return (
    <div className="flex gap-1 h-8 rounded-full overflow-hidden">
      {splits.map((split, i) => (
        <motion.div
          key={split.label}
          className={`${split.color} flex items-center justify-center relative group`}
          style={{ width: `${split.value}%` }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          aria-label={`${split.label}: ${split.amount} of 2.5% total fee`}
        >
          <span className="text-[10px] text-cream-50 font-semibold whitespace-nowrap">
            {split.amount}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// Dead Man's Switch Visualization
function DeadMansSwitchViz() {
  const [daysRemaining, setDaysRemaining] = useState(90);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setDaysRemaining((d) => (d <= 0 ? 90 : d - 1));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const percentage = (daysRemaining / 90) * 100;
  const isWarning = daysRemaining < 30;
  const isCritical = daysRemaining < 10;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-cream-100/60 text-sm">Heartbeat Timer</span>
        <motion.span 
          className={`font-mono text-lg ${
            isCritical ? 'text-red-400' : isWarning ? 'text-orange-400' : 'text-accent-400'
          }`}
          animate={{ scale: isCritical ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
        >
          {daysRemaining} days
        </motion.span>
      </div>
      <div className="h-3 rounded-full bg-cream-100/5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full transition-colors duration-300 ${
            isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-accent-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-cream-100/30 text-xs">
        {daysRemaining === 0 
          ? '⚠️ Auto-distribution triggered!' 
          : 'Creators must sign in every 90 days or funds auto-distribute to stakers'}
      </p>
    </div>
  );
}

// Burn Counter Animation
function BurnCounter() {
  const [burned, setBurned] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setBurned((b) => b + Math.random() * 0.01);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20"
      animate={{ 
        boxShadow: ['0 0 20px rgba(249,115,22,0.1)', '0 0 30px rgba(249,115,22,0.2)', '0 0 20px rgba(249,115,22,0.1)']
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-2xl"
          aria-hidden="true"
        >
          🔥
        </motion.div>
        <div>
          <div className="font-heading text-orange-400 text-lg">
            <AnimatedCounter value={burned} decimals={4} suffix=" $HIRE" />
          </div>
          <div className="text-cream-100/25 text-[10px] uppercase tracking-wider">Burned Forever</div>
        </div>
      </div>
      <p className="text-cream-100/30 text-xs mt-2">
        0.5% of every fee is burned. Deflationary by design.
      </p>
    </motion.div>
  );
}

export function TokenSection() {
  const [stats, setStats] = useState({
    totalStaked: '—',
    totalDistributed: '—',
    treasuryBps: 3000, // 30% treasury (new split)
    stakerApy: '—',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
          treasuryBps: bps || 3000,
          stakerApy: distributed > 0 && staked > 0 ? `${((distributed / staked) * 365 * 100).toFixed(1)}%` : '—',
        });
      } catch (e) {
        console.error('Failed to fetch token stats:', e);
        setError(true);
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
          <span className="text-accent-400 text-xs font-semibold uppercase tracking-widest">$HIRE Token</span>
          <h2 className="font-heading text-4xl sm:text-5xl text-cream-100 mt-3 max-w-lg">
            Stake <span className="text-accent-400">$HIRE</span>.
            <br />
            <span className="text-cream-100/20 italic">Collect real yield.</span>
          </h2>
          <p className="text-cream-100/40 text-lg mt-4 max-w-xl">
            Every completed task generates 2.5% in fees. 50% to stakers, 30% to treasury, 20% burned forever. 
            Real revenue. Real yield. Deflationary.
          </p>
        </motion.div>

        {/* Three column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                title: 'Fees flow in automatically',
                desc: '2.5% of every settled task routes to the fee distribution contract. No manual triggers.',
              },
              {
                step: '02',
                title: 'Revenue splits three ways',
                desc: '50% to stakers (1.25%). 30% to treasury (0.75%). 20% burned forever (0.5%). Deflationary.',
              },
              {
                step: '03',
                title: 'Claim USDC anytime',
                desc: 'Your share is proportional to your stake. No lock-up. No vesting. Withdraw whenever.',
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

            {/* Fee Split Visualization */}
            <div className="p-5 rounded-2xl border border-cream-100/5 bg-cream-100/[0.02]">
              <h4 className="text-cream-100/60 text-xs uppercase tracking-wider mb-3">Fee Distribution (2.5% total)</h4>
              <FeeSplitViz />
              <div className="flex justify-between mt-3 text-[10px] text-cream-100/40">
                <span>Stakers 50%</span>
                <span>Treasury 30%</span>
                <span>Burn 20%</span>
              </div>
            </div>
          </motion.div>

          {/* Middle: Token Distribution */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="rounded-3xl border border-cream-100/8 bg-cream-100/[0.03] p-6 h-full">
              <h3 className="font-heading text-cream-100 text-lg mb-6">Token Distribution</h3>
              
              <TokenDistributionChart />

              {/* Token stats */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-cream-100/5">
                {[
                  { label: 'Total Supply', value: TOKEN_SUPPLY },
                  { label: 'Staked', value: loading ? '...' : (error ? '—' : stats.totalStaked) },
                  { label: 'USDC Distributed', value: loading ? '...' : (error ? '—' : stats.totalDistributed) },
                  { label: 'Staker Share', value: '50%' },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-xl bg-cream-100/[0.03] border border-cream-100/5">
                    <div className="font-heading text-cream-100 text-sm">{s.value}</div>
                    <div className="text-cream-100/25 text-[10px] uppercase tracking-wider mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Burn counter */}
              <div className="mt-6">
                <BurnCounter />
              </div>
            </div>
          </motion.div>

          {/* Right: Dead Man's Switch + Contract Info */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {/* Dead Man's Switch */}
            <div className="rounded-3xl border border-cream-100/8 bg-cream-100/[0.03] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <span className="text-lg" aria-hidden="true">💀</span>
                </div>
                <div>
                  <h3 className="font-heading text-cream-100 text-lg">Dead Man's Switch</h3>
                  <p className="text-cream-100/30 text-xs">90-day heartbeat protection</p>
                </div>
              </div>
              
              <DeadMansSwitchViz />
            </div>

            {/* Contract info */}
            <div className="rounded-3xl border border-cream-100/8 bg-cream-100/[0.03] p-6">
              <h4 className="text-cream-100/60 text-xs uppercase tracking-wider mb-4">Contracts</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-cream-100/30 text-xs uppercase tracking-wider">Token</span>
                  <a
                    href={`${BLOCK_EXPLORER}address/${CLAWHIRE_TOKEN}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-400 text-xs font-mono hover:underline"
                    aria-label="View $HIRE token contract on block explorer"
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
                    aria-label="View staking contract on block explorer"
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
              <div className="mt-4 p-3 rounded-xl bg-accent-500/5 border border-accent-500/10">
                <p className="text-accent-400/60 text-xs leading-relaxed">
                  Synthetix-style reward accumulator. Battle-tested. Gas-efficient.
                  USDC yield accrues every block.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Interactive Staking Panel */}
        <StakingPanel />
      </div>
    </section>
  );
}

function StakingPanel() {
  const { address, connected } = useWallet();
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [userStaked, setUserStaked] = useState('0');
  const [pendingRewards, setPendingRewards] = useState('0');
  const [hireBalance, setHireBalance] = useState('0');
  const [loading, setLoading] = useState('');
  const [txHash, setTxHash] = useState('');

  const fetchUserData = useCallback(async () => {
    if (!address) return;
    try {
      const provider = new JsonRpcProvider(RPC_URL);
      const rs = new Contract(REVENUE_SHARE, REVENUE_SHARE_ABI, provider);
      const token = new Contract(CLAWHIRE_TOKEN, ERC20_ABI, provider);
      const [info, bal] = await Promise.all([
        rs.getStakeInfo(address),
        token.balanceOf(address),
      ]);
      setUserStaked(formatUnits(info[0], 18));
      setPendingRewards(formatUnits(info[1], 6));
      setHireBalance(formatUnits(bal, 18));
    } catch (e) {
      console.error('Failed to fetch staking data:', e);
    }
  }, [address]);

  useEffect(() => {
    fetchUserData();
    if (!connected) return;
    const iv = setInterval(fetchUserData, 15000);
    return () => clearInterval(iv);
  }, [connected, fetchUserData]);

  const getSigner = async () => {
    if (!window.ethereum) throw new Error('No wallet');
    const provider = new BrowserProvider(window.ethereum);
    return provider.getSigner();
  };

  const handleStake = async () => {
    if (!stakeAmount || Number(stakeAmount) <= 0) return;
    setLoading('stake');
    setTxHash('');
    try {
      const signer = await getSigner();
      const token = new Contract(CLAWHIRE_TOKEN, ERC20_ABI, signer);
      const rs = new Contract(REVENUE_SHARE, REVENUE_SHARE_ABI, signer);
      const amt = parseUnits(stakeAmount, 18);
      // Approve
      const allowance = await token.allowance(address, REVENUE_SHARE);
      if (allowance < amt) {
        const appTx = await token.approve(REVENUE_SHARE, MaxUint256);
        await appTx.wait();
      }
      const tx = await rs.stake(amt);
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setStakeAmount('');
      await fetchUserData();
    } catch (e: unknown) {
      console.error('Stake failed:', e);
      const msg = e instanceof Error ? e.message : 'Stake failed';
      alert(msg);
    } finally {
      setLoading('');
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || Number(unstakeAmount) <= 0) return;
    setLoading('unstake');
    setTxHash('');
    try {
      const signer = await getSigner();
      const rs = new Contract(REVENUE_SHARE, REVENUE_SHARE_ABI, signer);
      const tx = await rs.unstake(parseUnits(unstakeAmount, 18));
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setUnstakeAmount('');
      await fetchUserData();
    } catch (e: unknown) {
      console.error('Unstake failed:', e);
      const msg = e instanceof Error ? e.message : 'Unstake failed';
      alert(msg);
    } finally {
      setLoading('');
    }
  };

  const handleClaim = async () => {
    setLoading('claim');
    setTxHash('');
    try {
      const signer = await getSigner();
      const rs = new Contract(REVENUE_SHARE, REVENUE_SHARE_ABI, signer);
      const tx = await rs.claimRewards();
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      await fetchUserData();
    } catch (e: unknown) {
      console.error('Claim failed:', e);
      const msg = e instanceof Error ? e.message : 'Claim failed';
      alert(msg);
    } finally {
      setLoading('');
    }
  };

  if (!connected) return null;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="mt-12"
    >
      <div className="rounded-3xl border border-accent-500/20 bg-accent-500/[0.05] p-8">
        <h3 className="font-heading text-2xl text-cream-100 mb-6">Your Staking Position</h3>

        {/* Balances */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-cream-100/[0.03] border border-cream-100/5 text-center">
            <div className="font-heading text-cream-100 text-lg">{Number(hireBalance).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-cream-100/25 text-[10px] uppercase tracking-wider mt-1">$HIRE Balance</div>
          </div>
          <div className="p-4 rounded-2xl bg-accent-500/10 border border-accent-500/20 text-center">
            <div className="font-heading text-accent-400 text-lg">{Number(userStaked).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-cream-100/25 text-[10px] uppercase tracking-wider mt-1">Staked</div>
          </div>
          <div className="p-4 rounded-2xl bg-cream-100/[0.03] border border-cream-100/5 text-center">
            <div className="font-heading text-cream-100 text-lg">${Number(pendingRewards).toFixed(4)}</div>
            <div className="text-cream-100/25 text-[10px] uppercase tracking-wider mt-1">USDC Rewards</div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stake */}
          <div className="space-y-2">
            <label htmlFor="stake-amount" className="sr-only">Amount to stake</label>
            <input
              id="stake-amount"
              type="number"
              placeholder="Amount to stake"
              value={stakeAmount}
              onChange={e => setStakeAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-cream-100/[0.05] border border-cream-100/10 text-cream-100 text-sm placeholder:text-cream-100/20 focus:border-accent-500/40 focus:outline-none"
            />
            <button
              onClick={handleStake}
              disabled={loading === 'stake' || !stakeAmount}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-accent-500 text-bark-950 hover:bg-accent-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Stake HIRE tokens"
            >
              {loading === 'stake' ? 'Staking...' : 'Stake $HIRE'}
            </button>
          </div>

          {/* Unstake */}
          <div className="space-y-2">
            <label htmlFor="unstake-amount" className="sr-only">Amount to unstake</label>
            <input
              id="unstake-amount"
              type="number"
              placeholder="Amount to unstake"
              value={unstakeAmount}
              onChange={e => setUnstakeAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-cream-100/[0.05] border border-cream-100/10 text-cream-100 text-sm placeholder:text-cream-100/20 focus:border-accent-500/40 focus:outline-none"
            />
            <button
              onClick={handleUnstake}
              disabled={loading === 'unstake' || !unstakeAmount}
              className="w-full py-3 rounded-xl font-semibold text-sm border border-cream-100/20 text-cream-100 hover:bg-cream-100/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Unstake HIRE tokens"
            >
              {loading === 'unstake' ? 'Unstaking...' : 'Unstake'}
            </button>
          </div>

          {/* Claim */}
          <div className="space-y-2">
            <div className="px-4 py-3 rounded-xl bg-cream-100/[0.03] border border-cream-100/5 text-center">
              <span className="text-cream-100/40 text-sm">Claimable: </span>
              <span className="text-accent-400 font-heading">${Number(pendingRewards).toFixed(4)}</span>
            </div>
            <button
              onClick={handleClaim}
              disabled={loading === 'claim' || Number(pendingRewards) === 0}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-accent-500/20 text-accent-400 border border-accent-500/30 hover:bg-accent-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Claim USDC rewards"
            >
              {loading === 'claim' ? 'Claiming...' : 'Claim USDC'}
            </button>
          </div>
        </div>

        {/* TX feedback */}
        {txHash && (
          <div className="mt-4 p-3 rounded-xl bg-accent-500/10 border border-accent-500/20 text-center">
            <span className="text-accent-400 text-xs" aria-hidden="true">✅ </span>
            <a 
              href={`${BLOCK_EXPLORER}tx/${txHash}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-accent-400 text-xs hover:underline font-mono"
              aria-label="View transaction on block explorer"
            >
              {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}
