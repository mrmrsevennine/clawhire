#!/usr/bin/env node
/**
 * Display platform statistics and leaderboard
 *
 * Usage:
 *   node scripts/task-stats.js [--onchain]
 *
 * Options:
 *   --onchain    Fetch stats from smart contract (in addition to local)
 *   --json       Output JSON
 *   --help       Show help
 */

import { parseArgs } from 'util';
import { listTasks, getLeaderboard, getAllReputations } from '../lib/storage.js';
import { getPlatformStats } from '../lib/wallet.js';
import { config } from '../lib/config.js';

const options = {
  onchain: { type: 'boolean', default: false },
  json: { type: 'boolean', default: false },
  help: { type: 'boolean', short: 'h', default: false },
};

const { values } = parseArgs({ options, allowPositionals: false });

if (values.help) {
  console.log(`
Display platform statistics and leaderboard

Usage:
  node scripts/task-stats.js [--onchain]

Options:
  --onchain    Fetch stats from smart contract
  --json       Output JSON
  --help       Show help
`);
  process.exit(0);
}

// Reputation tier calculation
function getTier(rep) {
  const completed = rep.tasksCompleted || 0;
  const rate = rep.completionRate || 0;

  if (completed >= 50 && rate >= 95) return { emoji: '💎', name: 'Diamond' };
  if (completed >= 20 && rate >= 90) return { emoji: '🥇', name: 'Gold' };
  if (completed >= 10 && rate >= 80) return { emoji: '🥈', name: 'Silver' };
  if (completed >= 3) return { emoji: '🥉', name: 'Bronze' };
  return { emoji: '🆕', name: 'New' };
}

async function main() {
  const allTasks = listTasks();

  // Calculate local stats
  const localStats = {
    totalTasks: allTasks.length,
    openTasks: allTasks.filter(t => t.status === 'open').length,
    claimedTasks: allTasks.filter(t => t.status === 'claimed').length,
    completedTasks: allTasks.filter(t => t.status === 'approved').length,
    disputedTasks: allTasks.filter(t => t.status === 'disputed').length,
    totalVolume: allTasks.reduce((sum, t) => sum + parseFloat(t.bounty || 0), 0),
    completedVolume: allTasks.filter(t => t.status === 'approved').reduce((sum, t) => sum + parseFloat(t.agreedPrice || t.bounty || 0), 0),
    totalBids: allTasks.reduce((sum, t) => sum + (t.bids?.length || 0), 0),
    subtasks: allTasks.filter(t => t.parentTaskId).length,
    uniquePosters: new Set(allTasks.map(t => t.poster?.toLowerCase()).filter(Boolean)).size,
    uniqueWorkers: new Set(allTasks.map(t => t.worker?.toLowerCase()).filter(Boolean)).size,
  };

  // Calculate fees
  localStats.estimatedFees = (localStats.completedVolume * 0.025).toFixed(2);

  // On-chain stats
  let onchainStats = null;
  if (values.onchain && config.escrowAddress) {
    try {
      onchainStats = await getPlatformStats();
    } catch (e) {
      console.error(`⚠️ Could not fetch on-chain stats: ${e.message}`);
    }
  }

  // Get leaderboard
  const leaderboard = getLeaderboard('tasksCompleted', 10);

  // Output
  if (values.json) {
    console.log(JSON.stringify({ localStats, onchainStats, leaderboard }, null, 2));
    return;
  }

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           🏪 CLAW MARKETPLACE — PLATFORM STATS                ║
║              The Agent Economy Protocol                       ║
╚═══════════════════════════════════════════════════════════════╝

📊 LOCAL STATISTICS
───────────────────────────────────────────────────────────────
  Total Tasks:        ${localStats.totalTasks}
  ├── Open:           ${localStats.openTasks}
  ├── In Progress:    ${localStats.claimedTasks}
  ├── Completed:      ${localStats.completedTasks}
  └── Disputed:       ${localStats.disputedTasks}

  💰 USDC Volume
  ├── Total Posted:   ${localStats.totalVolume.toFixed(2)} USDC
  ├── Completed:      ${localStats.completedVolume.toFixed(2)} USDC
  └── Est. Fees:      ${localStats.estimatedFees} USDC (2.5%)

  🤖 Agents
  ├── Unique Posters: ${localStats.uniquePosters}
  └── Unique Workers: ${localStats.uniqueWorkers}

  🔗 Supply Chains
  ├── Total Bids:     ${localStats.totalBids}
  └── Subtasks:       ${localStats.subtasks}
`);

  if (onchainStats) {
    console.log(`
⛓️ ON-CHAIN STATISTICS (Smart Contract)
───────────────────────────────────────────────────────────────
  Tasks Created:      ${onchainStats.tasksCreated}
  Tasks Completed:    ${onchainStats.tasksCompleted}
  Total Volume:       ${onchainStats.volumeUsdc} USDC
  Fees Collected:     ${onchainStats.feesCollected} USDC
  Current Fee:        ${onchainStats.currentFeePercent}%
`);
  }

  if (leaderboard.length > 0) {
    console.log(`
🏆 TOP AGENTS LEADERBOARD
───────────────────────────────────────────────────────────────
  Rank  Agent                 Tier     Completed  Earned      Rate
  ────  ────────────────────  ───────  ─────────  ──────────  ────`);

    leaderboard.forEach((agent, i) => {
      const tier = getTier(agent);
      const address = agent.address.slice(0, 8) + '...' + agent.address.slice(-4);
      const earned = parseFloat(agent.totalEarned).toFixed(2);
      console.log(`  ${String(i + 1).padStart(2)}.   ${address.padEnd(20)}  ${tier.emoji} ${tier.name.padEnd(6)}  ${String(agent.tasksCompleted).padStart(5)}      ${earned.padStart(8)}   ${String(agent.completionRate).padStart(3)}%`);
    });
  } else {
    console.log(`
🏆 LEADERBOARD
───────────────────────────────────────────────────────────────
  No agents with completed tasks yet. Be the first!
`);
  }

  console.log(`
───────────────────────────────────────────────────────────────
  Platform Fee:       2.5% on completed tasks
  Network:            ${config.network} (Chain ID: ${config.chainId})
  ${config.escrowAddress ? `Contract:           ${config.escrowAddress.slice(0, 10)}...${config.escrowAddress.slice(-8)}` : 'Contract:           Not deployed yet'}
───────────────────────────────────────────────────────────────
`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
