#!/usr/bin/env node
/**
 * Accept a bid on your task
 *
 * Usage:
 *   node scripts/task-accept-bid.js --task-id <id> --bidder <address>
 *
 * Options:
 *   --task-id    Task ID (required)
 *   --bidder     Bidder address to accept (required)
 *   --onchain    Execute on smart contract
 *   --json       Output JSON
 *   --help       Show help
 */

import { parseArgs } from 'util';
import { getTask, acceptBidInTask, getBidsForTask, updateReputation } from '../lib/storage.js';
import { acceptBidOnChain } from '../lib/wallet.js';
import { config } from '../lib/config.js';

const options = {
  'task-id': { type: 'string' },
  bidder: { type: 'string' },
  onchain: { type: 'boolean', default: false },
  json: { type: 'boolean', default: false },
  help: { type: 'boolean', short: 'h', default: false },
};

const { values } = parseArgs({ options, allowPositionals: false });

if (values.help) {
  console.log(`
Accept a bid on your task

Usage:
  node scripts/task-accept-bid.js --task-id <id> --bidder <address>

Options:
  --task-id    Task ID (required)
  --bidder     Bidder address to accept (required)
  --onchain    Execute on smart contract
  --json       Output JSON

Example:
  node scripts/task-accept-bid.js --task-id task-001 --bidder 0x1234...
`);
  process.exit(0);
}

// Validate required args
if (!values['task-id']) {
  console.error('❌ Error: --task-id is required');
  process.exit(1);
}

if (!values.bidder) {
  console.error('❌ Error: --bidder is required');
  console.log('\nAvailable bids:');
  const bids = getBidsForTask(values['task-id']);
  bids.forEach((b, i) => {
    console.log(`  ${i + 1}. ${b.bidder} - ${b.price} USDC (${b.estimatedHours}h)`);
  });
  process.exit(1);
}

const taskId = values['task-id'];
const bidderAddress = values.bidder;

async function main() {
  // Load task
  const task = getTask(taskId);
  if (!task) {
    console.error(`❌ Error: Task "${taskId}" not found`);
    process.exit(1);
  }

  if (task.status !== 'open') {
    console.error(`❌ Error: Task is not open (status: ${task.status})`);
    process.exit(1);
  }

  // Find bid
  const bids = getBidsForTask(taskId);
  const bid = bids.find(b => b.bidder?.toLowerCase() === bidderAddress.toLowerCase());

  if (!bid) {
    console.error(`❌ Error: No bid found from ${bidderAddress}`);
    console.log('\nAvailable bids:');
    bids.forEach((b, i) => {
      console.log(`  ${i + 1}. ${b.bidder} - ${b.price} USDC (${b.estimatedHours || Math.round(b.estimatedTime / 3600)}h)`);
    });
    process.exit(1);
  }

  // On-chain accept
  let txHash;
  if (values.onchain) {
    if (!config.escrowAddress) {
      console.error('❌ Error: ESCROW_ADDRESS required for on-chain operations');
      process.exit(1);
    }

    try {
      console.log(`📤 Accepting bid on-chain...`);
      const result = await acceptBidOnChain(taskId, bidderAddress);
      txHash = result.txHash;
      console.log(`✅ Bid accepted on-chain: ${txHash}`);
    } catch (error) {
      console.error(`❌ On-chain accept failed: ${error.message}`);
      process.exit(1);
    }
  }

  // Update local storage
  const updatedTask = acceptBidInTask(taskId, bidderAddress);

  // Calculate savings
  const originalBounty = parseFloat(task.bounty);
  const acceptedPrice = parseFloat(bid.price);
  const savings = originalBounty - acceptedPrice;

  // Output
  if (values.json) {
    console.log(JSON.stringify({ taskId, bid, task: updatedTask, txHash, savings }, null, 2));
  } else {
    console.log(`
✅ Bid Accepted!

  Task:          ${taskId}
  Worker:        ${bidderAddress}
  Agreed Price:  ${acceptedPrice.toFixed(2)} USDC
  ${savings > 0 ? `Savings:       ${savings.toFixed(2)} USDC (${((savings / originalBounty) * 100).toFixed(0)}% below bounty)` : ''}
  ${txHash ? `Tx Hash:       ${txHash}` : ''}

The task is now claimed. Waiting for worker to deliver...

Next step: Worker submits deliverable with:
  node scripts/task-submit.js --task-id ${taskId} --deliverable <url>
`);
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
