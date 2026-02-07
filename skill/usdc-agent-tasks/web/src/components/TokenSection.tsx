import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '../lib/animations';
import { useState, useEffect, useCallback } from 'react';
import { JsonRpcProvider, BrowserProvider, Contract, formatUnits, parseUnits, MaxUint256 } from 'ethers';
import { CLAWHIRE_TOKEN, REVENUE_SHARE, REVENUE_SHARE_ABI, ERC20_ABI, RPC_URL, BLOCK_EXPLORER } from '../lib/contract';
import { useWallet } from '../hooks/useWallet';

const TOKEN_SUPPLY = '100,000,000';

export function TokenSection() {
  const [stats, setStats] = useState({
    totalStaked: '—',
    totalDistributed: '—',
    treasuryBps: 5000,
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
          treasuryBps: bps,
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
            Every completed task generates fees. Half goes straight to $HIRE stakers — paid in USDC, not inflationary tokens. Real revenue. Real yield.
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
                title: 'Fees flow in automatically',
                desc: '2.5% of every settled task routes directly to the RevenueShare contract. No manual triggers. No governance votes.',
              },
              {
                step: '02',
                title: 'Revenue splits on-chain',
                desc: `${100 - stats.treasuryBps / 100}% to stakers. ${stats.treasuryBps / 100}% to protocol treasury. Transparent. Governance-adjustable.`,
              },
              {
                step: '03',
                title: 'Claim USDC anytime',
                desc: 'Your share is proportional to your stake. No lock-up. No vesting cliff. Withdraw whenever you want.',
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
                  <p className="text-cream-100/30 text-xs uppercase tracking-wider">Platform Revenue Token</p>
                </div>
              </div>

              {/* Token stats grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: 'Fixed Supply', value: TOKEN_SUPPLY },
                  { label: 'Staked', value: loading ? '...' : (error ? '—' : stats.totalStaked) },
                  { label: 'USDC Paid Out', value: loading ? '...' : (error ? '—' : stats.totalDistributed) },
                  { label: 'Your Cut', value: `${100 - stats.treasuryBps / 100}%` },
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
                  Synthetix-style reward accumulator. Battle-tested. Gas-efficient.
                  Stake when you want. Unstake when you want. Your USDC yield accrues every block.
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
    } catch (e: any) {
      console.error('Stake failed:', e);
      alert(e.reason || e.message || 'Stake failed');
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
    } catch (e: any) {
      console.error('Unstake failed:', e);
      alert(e.reason || e.message || 'Unstake failed');
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
    } catch (e: any) {
      console.error('Claim failed:', e);
      alert(e.reason || e.message || 'Claim failed');
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
            <input
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
            >
              {loading === 'stake' ? 'Staking...' : 'Stake $HIRE'}
            </button>
          </div>

          {/* Unstake */}
          <div className="space-y-2">
            <input
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
            >
              {loading === 'claim' ? 'Claiming...' : 'Claim USDC'}
            </button>
          </div>
        </div>

        {/* TX feedback */}
        {txHash && (
          <div className="mt-4 p-3 rounded-xl bg-accent-500/10 border border-accent-500/20 text-center">
            <span className="text-accent-400 text-xs">✅ </span>
            <a href={`${BLOCK_EXPLORER}tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-accent-400 text-xs hover:underline font-mono">
              {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}
