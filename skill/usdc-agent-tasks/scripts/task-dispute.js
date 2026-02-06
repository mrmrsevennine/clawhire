#!/usr/bin/env node
// Dispute a submitted task
// Usage: node scripts/task-dispute.js --task-id <id> --reason "reason" [--onchain]

import { parseArgs } from 'util';
import { getTask, saveTask, updateReputation } from '../lib/storage.js';
import { disputeTaskOnChain } from '../lib/wallet.js';

const { values: args } = parseArgs({
  options: {
    'task-id': { type: 'string', short: 'i' },
    reason: { type: 'string', short: 'r' },
    onchain: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h' },
  },
  strict: false,
});

if (args.help || !args['task-id']) {
  console.log(`
🔴 Dispute a Task

Usage:
  node scripts/task-dispute.js --task-id <id> [options]

Options:
  --task-id, -i   Task ID (required)
  --reason, -r    Reason for dispute
  --onchain       Also dispute on escrow contract
  --help, -h      Show this help

Examples:
  node scripts/task-dispute.js -i task-123 -r "Deliverable incomplete"
  node scripts/task-dispute.js -i task-123 --reason "Wrong format" --onchain
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

  if (task.status !== 'submitted') {
    console.error(`❌ Task is not submitted (current status: ${task.status})`);
    process.exit(1);
  }

  console.log('🔴 Disputing task...');
  console.log(`   Task: ${task.title}`);
  console.log(`   Reason: ${args.reason || 'Not specified'}`);

  let txHash = null;

  // On-chain dispute
  if (args.onchain || task.onchain) {
    console.log('\n⛓️  Disputing on-chain...');
    try {
      const result = await disputeTaskOnChain(taskId);
      txHash = result.txHash;
      console.log(`   ✅ Disputed on-chain! TX: ${txHash}`);
    } catch (err) {
      console.error(`❌ On-chain dispute failed: ${err.message}`);
      process.exit(1);
    }
  }

  // Update local storage
  saveTask(taskId, {
    status: 'disputed',
    disputeReason: args.reason || '',
    disputeTxHash: txHash,
    disputedAt: new Date().toISOString(),
  });

  // Update reputation for worker
  if (task.worker) {
    updateReputation(task.worker, {
      tasksDisputed: 1,
      event: 'task_disputed',
      taskId,
    });
  }

  console.log('\n🔴 Task disputed.');
  console.log(JSON.stringify({
    id: taskId,
    title: task.title,
    bounty: `${task.bounty} USDC`,
    status: 'disputed',
    reason: args.reason || '',
  }, null, 2));
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
