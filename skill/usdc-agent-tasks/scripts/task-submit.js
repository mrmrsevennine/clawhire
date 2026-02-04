#!/usr/bin/env node
// Submit a deliverable for a claimed task
// Usage: node scripts/task-submit.js --task-id <id> --deliverable "URL or description" [--onchain]

const { parseArgs } = require('util');
const crypto = require('crypto');
const { getTask, saveTask } = require('../lib/storage');
const { getWallet, submitDeliverableOnChain } = require('../lib/wallet');

const { values: args } = parseArgs({
  options: {
    'task-id': { type: 'string', short: 'i' },
    deliverable: { type: 'string', short: 'd' },
    onchain: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h' },
  },
  strict: false,
});

if (args.help || !args['task-id'] || !args.deliverable) {
  console.log(`
📦 Submit a Deliverable

Usage:
  node scripts/task-submit.js --task-id <id> --deliverable "result" [options]

Options:
  --task-id, -i       Task ID (required)
  --deliverable, -d   Deliverable content/URL/description (required)
  --onchain           Also submit hash on escrow contract
  --help, -h          Show this help

Examples:
  node scripts/task-submit.js -i task-123 -d "https://gist.github.com/results"
  node scripts/task-submit.js -i task-123 -d "SEO audit complete. Found 15 issues." --onchain
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

  if (task.status !== 'claimed') {
    console.error(`❌ Task is not claimed (current status: ${task.status})`);
    process.exit(1);
  }

  const deliverable = args.deliverable;
  const deliverableHash = crypto.createHash('sha256').update(deliverable).digest('hex');
  let txHash = null;

  console.log('📦 Submitting deliverable...');
  console.log(`   Task: ${task.title}`);
  console.log(`   Deliverable: ${deliverable.substring(0, 100)}${deliverable.length > 100 ? '...' : ''}`);
  console.log(`   Hash: ${deliverableHash}`);

  // On-chain submission
  if (args.onchain || task.onchain) {
    console.log('\n⛓️  Submitting on-chain...');
    try {
      const result = await submitDeliverableOnChain(taskId, deliverableHash);
      txHash = result.txHash;
      console.log(`   ✅ Submitted on-chain! TX: ${txHash}`);
    } catch (err) {
      console.error(`❌ On-chain submission failed: ${err.message}`);
      process.exit(1);
    }
  }

  // Update local storage
  saveTask(taskId, {
    status: 'submitted',
    deliverable,
    deliverableHash,
    submitTxHash: txHash,
    submittedAt: new Date().toISOString(),
  });

  console.log('\n✅ Deliverable submitted!');
  console.log(JSON.stringify({
    id: taskId,
    title: task.title,
    bounty: `${task.bounty} USDC`,
    status: 'submitted',
    deliverableHash,
  }, null, 2));
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
