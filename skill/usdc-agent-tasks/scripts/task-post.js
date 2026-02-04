#!/usr/bin/env node
// Post a new task with USDC bounty
// Usage: node scripts/task-post.js --title "SEO Audit" --bounty 5.00 [--description "..."] [--tags "seo,audit"] [--onchain]

const { parseArgs } = require('util');
const crypto = require('crypto');
const { config } = require('../lib/config');
const { saveTask } = require('../lib/storage');
const { updateReputation } = require('../lib/storage');
const { getWallet, getUsdcBalance, createTaskOnChain } = require('../lib/wallet');

const { values: args } = parseArgs({
  options: {
    title: { type: 'string', short: 't' },
    bounty: { type: 'string', short: 'b' },
    description: { type: 'string', short: 'd' },
    tags: { type: 'string' },
    onchain: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h' },
  },
  strict: false,
});

if (args.help || !args.title || !args.bounty) {
  console.log(`
📋 Post a New Task with USDC Bounty

Usage:
  node scripts/task-post.js --title "Task title" --bounty 5.00 [options]

Options:
  --title, -t       Task title (required)
  --bounty, -b      USDC bounty amount (required)
  --description, -d Task description
  --tags            Comma-separated tags
  --onchain         Deposit bounty to escrow contract
  --help, -h        Show this help

Examples:
  node scripts/task-post.js --title "SEO Audit for example.com" --bounty 10.00
  node scripts/task-post.js -t "Write API docs" -b 25.00 -d "Complete REST API docs" --tags "docs,api"
  node scripts/task-post.js -t "Smart Contract Review" -b 50.00 --onchain
`);
  process.exit(args.help ? 0 : 1);
}

async function main() {
  const bounty = parseFloat(args.bounty);
  if (isNaN(bounty) || bounty <= 0) {
    console.error('❌ Invalid bounty amount. Must be a positive number.');
    process.exit(1);
  }

  // Generate unique task ID
  const taskId = `task-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  console.log('📋 Posting new task...');
  console.log(`   Title: ${args.title}`);
  console.log(`   Bounty: ${bounty} USDC`);
  console.log(`   Task ID: ${taskId}`);

  let poster = 'local';
  let txHash = null;

  // On-chain escrow deposit
  if (args.onchain) {
    console.log('\n💰 Depositing bounty to escrow contract...');
    try {
      const wallet = getWallet();
      poster = wallet.address;

      // Check balance
      const balance = await getUsdcBalance(poster);
      console.log(`   USDC Balance: ${balance}`);
      if (parseFloat(balance) < bounty) {
        console.error(`❌ Insufficient USDC balance. Have ${balance}, need ${bounty}`);
        process.exit(1);
      }

      const result = await createTaskOnChain(taskId, bounty);
      txHash = result.txHash;
      console.log(`   ✅ Deposited! TX: ${txHash}`);
    } catch (err) {
      console.error(`❌ On-chain deposit failed: ${err.message}`);
      console.log('   Saving task as off-chain (no escrow deposit)');
    }
  }

  // Save task locally
  const task = saveTask(taskId, {
    title: args.title,
    description: args.description || '',
    bounty: bounty.toFixed(2),
    tags: args.tags ? args.tags.split(',').map(t => t.trim()) : [],
    poster,
    worker: null,
    status: 'open',
    onchain: !!txHash,
    txHash,
    deliverable: null,
    createdAt: new Date().toISOString(),
  });

  // Update reputation
  updateReputation(poster, {
    tasksPosted: 1,
    event: 'task_posted',
    taskId,
    amount: bounty.toFixed(2),
  });

  console.log('\n✅ Task posted successfully!');
  console.log(JSON.stringify({
    id: taskId,
    title: task.title,
    bounty: `${task.bounty} USDC`,
    status: task.status,
    onchain: task.onchain,
  }, null, 2));
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
