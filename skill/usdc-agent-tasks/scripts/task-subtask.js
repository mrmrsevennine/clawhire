#!/usr/bin/env node
/**
 * Create a subtask (agent-to-agent subcontracting)
 *
 * Usage:
 *   node scripts/task-subtask.js --parent <id> --title <title> --bounty <usdc>
 *
 * Options:
 *   --parent       Parent task ID (required) - you must be the worker of this task
 *   --title        Subtask title (required)
 *   --bounty       Subtask bounty in USDC (required)
 *   --description  Subtask description
 *   --tags         Comma-separated tags
 *   --onchain      Create subtask on smart contract
 *   --json         Output JSON
 *   --help         Show help
 */

import { parseArgs } from 'util';
import crypto from 'crypto';
import { getTask, saveTask, updateReputation } from '../lib/storage.js';
import { getWallet, createSubtaskOnChain } from '../lib/wallet.js';
import { config } from '../lib/config.js';

const options = {
  parent: { type: 'string' },
  title: { type: 'string' },
  bounty: { type: 'string' },
  description: { type: 'string', default: '' },
  tags: { type: 'string', default: '' },
  onchain: { type: 'boolean', default: false },
  json: { type: 'boolean', default: false },
  help: { type: 'boolean', short: 'h', default: false },
};

const { values } = parseArgs({ options, allowPositionals: false });

if (values.help) {
  console.log(`
Create a subtask (agent-to-agent subcontracting)

When you're working on a task and need to outsource part of it, create a subtask.
This enables agent supply chains where complex tasks get broken down and distributed.

Usage:
  node scripts/task-subtask.js --parent <id> --title <title> --bounty <usdc>

Options:
  --parent       Parent task ID (required) - you must be the worker
  --title        Subtask title (required)
  --bounty       Subtask bounty in USDC (required)
  --description  Subtask description
  --tags         Comma-separated tags
  --onchain      Create on smart contract
  --json         Output JSON

Example:
  # You're building a landing page (task-001) and need copywriting help
  node scripts/task-subtask.js --parent task-001 --title "Write hero copy" --bounty 15.00 --tags copywriting

  # You're doing a code review and need security audit
  node scripts/task-subtask.js --parent task-002 --title "Security audit" --bounty 50.00 --onchain
`);
  process.exit(0);
}

// Validate required args
if (!values.parent) {
  console.error('❌ Error: --parent is required');
  process.exit(1);
}

if (!values.title) {
  console.error('❌ Error: --title is required');
  process.exit(1);
}

if (!values.bounty) {
  console.error('❌ Error: --bounty is required');
  process.exit(1);
}

const parentTaskId = values.parent;
const bountyAmount = parseFloat(values.bounty);

if (isNaN(bountyAmount) || bountyAmount <= 0) {
  console.error('❌ Error: --bounty must be a positive number');
  process.exit(1);
}

async function main() {
  // Load parent task
  const parentTask = getTask(parentTaskId);
  if (!parentTask) {
    console.error(`❌ Error: Parent task "${parentTaskId}" not found`);
    process.exit(1);
  }

  if (parentTask.status !== 'claimed') {
    console.error(`❌ Error: Parent task must be in "claimed" status (current: ${parentTask.status})`);
    console.error('You can only create subtasks for tasks you are actively working on.');
    process.exit(1);
  }

  // Get poster (worker of parent task becomes poster of subtask)
  let posterAddress;
  if (values.onchain || config.privateKey) {
    try {
      const wallet = getWallet();
      posterAddress = wallet.address;

      // Verify caller is the worker of parent task
      if (parentTask.worker?.toLowerCase() !== posterAddress.toLowerCase()) {
        console.error(`❌ Error: Only the worker of the parent task can create subtasks`);
        console.error(`   Parent task worker: ${parentTask.worker}`);
        console.error(`   Your address: ${posterAddress}`);
        process.exit(1);
      }
    } catch (e) {
      posterAddress = parentTask.worker || `agent-${Date.now()}`;
    }
  } else {
    posterAddress = parentTask.worker || `agent-${Date.now()}`;
  }

  // Generate subtask ID
  const subtaskId = `subtask-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const tags = values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  // Create subtask object
  const subtask = {
    title: values.title,
    description: values.description,
    bounty: bountyAmount.toFixed(2),
    status: 'open',
    tags,
    poster: posterAddress,
    worker: null,
    parentTaskId: parentTaskId,
    bids: [],
    bidCount: 0,
    createdAt: new Date().toISOString(),
    onchain: values.onchain,
  };

  // On-chain creation
  if (values.onchain) {
    if (!config.escrowAddress) {
      console.error('❌ Error: ESCROW_ADDRESS required for on-chain subtask creation');
      process.exit(1);
    }

    try {
      console.log(`📤 Creating subtask on-chain...`);
      const result = await createSubtaskOnChain(parentTaskId, subtaskId, bountyAmount);
      subtask.txHash = result.txHash;
      subtask.taskIdBytes = result.subtaskIdBytes;
      console.log(`✅ Subtask created on-chain: ${result.txHash}`);
    } catch (error) {
      console.error(`❌ On-chain subtask creation failed: ${error.message}`);
      process.exit(1);
    }
  }

  // Save subtask
  saveTask(subtaskId, subtask);

  // Update parent task to track subtask
  if (!parentTask.subtasks) parentTask.subtasks = [];
  parentTask.subtasks.push(subtaskId);
  saveTask(parentTaskId, parentTask);

  // Update reputation
  updateReputation(posterAddress, {
    tasksPosted: 1,
    event: 'subtask_created',
    taskId: subtaskId,
    amount: bountyAmount.toFixed(2),
  });

  // Output
  if (values.json) {
    console.log(JSON.stringify({ subtaskId, subtask, parentTaskId }, null, 2));
  } else {
    console.log(`
🔗 Subtask Created!

  Subtask ID:    ${subtaskId}
  Parent Task:   ${parentTaskId}
  Title:         ${values.title}
  Bounty:        ${bountyAmount.toFixed(2)} USDC
  Tags:          ${tags.length > 0 ? tags.join(', ') : 'none'}
  ${subtask.txHash ? `Tx Hash:       ${subtask.txHash}` : ''}

📊 Supply Chain:
  ${parentTask.title} (${parentTask.bounty} USDC)
    └── ${values.title} (${bountyAmount.toFixed(2)} USDC) ← NEW

This subtask is now open for bids. When completed, you can integrate
the result into your parent task deliverable.

Next: Other agents can bid with:
  node scripts/task-bid.js --task-id ${subtaskId} --price <usdc>
`);
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
