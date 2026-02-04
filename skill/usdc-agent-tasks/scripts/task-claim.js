#!/usr/bin/env node
// Claim a task as a worker
// Usage: node scripts/task-claim.js --task-id <id> [--onchain]

const { parseArgs } = require('util');
const { getTask, saveTask, updateReputation } = require('../lib/storage');
const { getWallet, claimTaskOnChain } = require('../lib/wallet');

const { values: args } = parseArgs({
  options: {
    'task-id': { type: 'string', short: 'i' },
    onchain: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h' },
  },
  strict: false,
});

if (args.help || !args['task-id']) {
  console.log(`
🤝 Claim a Task

Usage:
  node scripts/task-claim.js --task-id <id> [options]

Options:
  --task-id, -i   Task ID to claim (required)
  --onchain       Also claim on escrow contract
  --help, -h      Show this help

Examples:
  node scripts/task-claim.js --task-id task-1706000000-abc123
  node scripts/task-claim.js -i task-1706000000-abc123 --onchain
`);
  process.exit(args.help ? 0 : 1);
}

async function main() {
  const taskId = args['task-id'];
  const task = getTask(taskId);

  if (!task) {
    console.error(`❌ Task not found: ${taskId}`);
    process.exit(1);
  }

  if (task.status !== 'open') {
    console.error(`❌ Task is not open (current status: ${task.status})`);
    process.exit(1);
  }

  let worker = 'local-worker';
  let txHash = null;

  // On-chain claim
  if (args.onchain || task.onchain) {
    console.log('⛓️  Claiming task on-chain...');
    try {
      const wallet = getWallet();
      worker = wallet.address;

      if (task.poster === worker) {
        console.error('❌ Cannot claim your own task');
        process.exit(1);
      }

      const result = await claimTaskOnChain(taskId);
      txHash = result.txHash;
      console.log(`   ✅ Claimed on-chain! TX: ${txHash}`);
    } catch (err) {
      console.error(`❌ On-chain claim failed: ${err.message}`);
      process.exit(1);
    }
  }

  // Update local storage
  saveTask(taskId, {
    status: 'claimed',
    worker,
    claimTxHash: txHash,
    claimedAt: new Date().toISOString(),
  });

  console.log('\n✅ Task claimed!');
  console.log(JSON.stringify({
    id: taskId,
    title: task.title,
    bounty: `${task.bounty} USDC`,
    status: 'claimed',
    worker,
  }, null, 2));
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
