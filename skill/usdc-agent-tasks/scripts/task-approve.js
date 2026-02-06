#!/usr/bin/env node
// Approve a submitted task and release USDC to worker
// Usage: node scripts/task-approve.js --task-id <id> [--onchain]

import { parseArgs } from 'util';
import { getTask, saveTask, updateReputation } from '../lib/storage.js';
import { getWallet, approveTaskOnChain, transferUsdc } from '../lib/wallet.js';

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
✅ Approve Task & Release USDC

Usage:
  node scripts/task-approve.js --task-id <id> [options]

Options:
  --task-id, -i   Task ID (required)
  --onchain       Release USDC via escrow contract
  --help, -h      Show this help

Examples:
  node scripts/task-approve.js --task-id task-123
  node scripts/task-approve.js -i task-123 --onchain
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

  console.log('✅ Approving task...');
  console.log(`   Task: ${task.title}`);
  console.log(`   Bounty: ${task.bounty} USDC`);
  console.log(`   Worker: ${task.worker}`);

  let txHash = null;

  // On-chain approval
  if (args.onchain || task.onchain) {
    console.log('\n💰 Releasing USDC via escrow...');
    try {
      const result = await approveTaskOnChain(taskId);
      txHash = result.txHash;
      console.log(`   ✅ USDC released! TX: ${txHash}`);
    } catch (err) {
      console.error(`❌ On-chain approval failed: ${err.message}`);
      process.exit(1);
    }
  } else if (task.worker && task.worker !== 'local-worker') {
    // Off-chain: direct USDC transfer
    console.log('\n💰 Sending USDC directly...');
    try {
      const result = await transferUsdc(task.worker, task.bounty);
      txHash = result.txHash;
      console.log(`   ✅ USDC sent! TX: ${txHash}`);
    } catch (err) {
      console.error(`⚠️  Direct transfer failed: ${err.message}`);
      console.log('   Task approved locally (manual payment needed)');
    }
  }

  // Update local storage
  saveTask(taskId, {
    status: 'approved',
    approveTxHash: txHash,
    approvedAt: new Date().toISOString(),
  });

  // Update reputation for worker
  if (task.worker) {
    updateReputation(task.worker, {
      tasksCompleted: 1,
      earned: task.bounty,
      event: 'task_completed',
      taskId,
      amount: task.bounty,
    });
  }

  // Update reputation for poster
  if (task.poster) {
    updateReputation(task.poster, {
      spent: task.bounty,
      event: 'task_approved',
      taskId,
      amount: task.bounty,
    });
  }

  console.log('\n✅ Task approved! USDC released to worker.');
  console.log(JSON.stringify({
    id: taskId,
    title: task.title,
    bounty: `${task.bounty} USDC`,
    status: 'approved',
    worker: task.worker,
    txHash,
  }, null, 2));
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
