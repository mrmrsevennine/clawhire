#!/usr/bin/env node
// List available tasks
// Usage: node scripts/task-list.js [--status open] [--poster 0x...] [--worker 0x...] [--json]

const { parseArgs } = require('util');
const { listTasks } = require('../lib/storage');

const { values: args } = parseArgs({
  options: {
    status: { type: 'string', short: 's' },
    poster: { type: 'string', short: 'p' },
    worker: { type: 'string', short: 'w' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h' },
  },
  strict: false,
});

if (args.help) {
  console.log(`
📋 List Tasks

Usage:
  node scripts/task-list.js [options]

Options:
  --status, -s    Filter by status (open|claimed|submitted|approved|disputed|refunded)
  --poster, -p    Filter by poster address
  --worker, -w    Filter by worker address
  --json          Output as JSON
  --help, -h      Show this help

Examples:
  node scripts/task-list.js                    # List all tasks
  node scripts/task-list.js --status open      # Only open tasks
  node scripts/task-list.js --worker 0x1234    # Tasks for a specific worker
`);
  process.exit(0);
}

const filter = {};
if (args.status) filter.status = args.status;
if (args.poster) filter.poster = args.poster;
if (args.worker) filter.worker = args.worker;

const tasks = listTasks(filter);

if (tasks.length === 0) {
  console.log('📭 No tasks found.');
  process.exit(0);
}

if (args.json) {
  console.log(JSON.stringify(tasks, null, 2));
} else {
  console.log(`📋 Tasks (${tasks.length} found):\n`);

  const statusEmoji = {
    open: '🟢',
    claimed: '🟡',
    submitted: '🔵',
    approved: '✅',
    disputed: '🔴',
    refunded: '↩️',
  };

  for (const task of tasks) {
    const emoji = statusEmoji[task.status] || '⚪';
    console.log(`${emoji} ${task.id}`);
    console.log(`   Title:   ${task.title}`);
    console.log(`   Bounty:  ${task.bounty} USDC`);
    console.log(`   Status:  ${task.status}`);
    if (task.poster && task.poster !== 'local') {
      console.log(`   Poster:  ${task.poster}`);
    }
    if (task.worker) {
      console.log(`   Worker:  ${task.worker}`);
    }
    if (task.tags && task.tags.length > 0) {
      console.log(`   Tags:    ${task.tags.join(', ')}`);
    }
    if (task.onchain) {
      console.log(`   Chain:   ✅ On-chain escrow`);
    }
    console.log(`   Created: ${task.createdAt}`);
    console.log('');
  }
}
