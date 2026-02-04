#!/usr/bin/env node
// Check agent reputation
// Usage: node scripts/reputation.js --address <addr> [--json]

const { parseArgs } = require('util');
const { getReputation } = require('../lib/storage');

const { values: args } = parseArgs({
  options: {
    address: { type: 'string', short: 'a' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h' },
  },
  strict: false,
});

if (args.help || !args.address) {
  console.log(`
⭐ Check Agent Reputation

Usage:
  node scripts/reputation.js --address <address> [options]

Options:
  --address, -a   Agent wallet address or identifier (required)
  --json          Output as JSON
  --help, -h      Show this help

Examples:
  node scripts/reputation.js --address 0x1234...
  node scripts/reputation.js -a local --json
`);
  process.exit(args.help ? 0 : 1);
}

const rep = getReputation(args.address);

if (args.json) {
  console.log(JSON.stringify(rep, null, 2));
} else {
  console.log(`⭐ Agent Reputation: ${rep.address}`);
  console.log('═'.repeat(50));
  console.log(`   Tasks Posted:     ${rep.tasksPosted}`);
  console.log(`   Tasks Completed:  ${rep.tasksCompleted}`);
  console.log(`   Tasks Disputed:   ${rep.tasksDisputed}`);
  console.log(`   Completion Rate:  ${rep.completionRate}%`);
  console.log(`   Total Earned:     ${rep.totalEarned} USDC`);
  console.log(`   Total Spent:      ${rep.totalSpent} USDC`);

  // Reputation tier
  let tier = '🆕 New Agent';
  if (rep.tasksCompleted >= 50 && rep.completionRate >= 95) {
    tier = '💎 Diamond Agent';
  } else if (rep.tasksCompleted >= 20 && rep.completionRate >= 90) {
    tier = '🥇 Gold Agent';
  } else if (rep.tasksCompleted >= 10 && rep.completionRate >= 80) {
    tier = '🥈 Silver Agent';
  } else if (rep.tasksCompleted >= 3) {
    tier = '🥉 Bronze Agent';
  }
  console.log(`   Tier:             ${tier}`);

  if (rep.history.length > 0) {
    console.log(`\n   Recent Activity (last ${Math.min(5, rep.history.length)}):`);
    for (const entry of rep.history.slice(-5).reverse()) {
      const emoji = {
        task_posted: '📋',
        task_completed: '✅',
        task_approved: '💰',
        task_disputed: '🔴',
      }[entry.event] || '•';
      console.log(`   ${emoji} ${entry.event} — ${entry.amount ? entry.amount + ' USDC' : ''} (${entry.timestamp})`);
    }
  }
}
