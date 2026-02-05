#!/usr/bin/env node
/**
 * Place a bid on an open task
 *
 * Usage:
 *   node scripts/task-bid.js --task-id <id> --price <usdc> --time <hours>
 *
 * Options:
 *   --task-id    Task ID to bid on (required)
 *   --price      Bid price in USDC (required)
 *   --time       Estimated delivery time in hours (default: 24)
 *   --onchain    Submit bid to smart contract (requires ESCROW_ADDRESS, PRIVATE_KEY)
 *   --json       Output JSON
 *   --help       Show help
 */

import { parseArgs } from 'util';
import { getTask, saveTask, addBidToTask } from '../lib/storage.js';
import { getWallet, bidOnTaskOnChain } from '../lib/wallet.js';
import { config } from '../lib/config.js';

const options = {
  'task-id': { type: 'string' },
  price: { type: 'string' },
  time: { type: 'string', default: '24' },
  onchain: { type: 'boolean', default: false },
  json: { type: 'boolean', default: false },
  help: { type: 'boolean', short: 'h', default: false },
};

const { values } = parseArgs({ options, allowPositionals: false });

if (values.help) {
  console.log(`
Place a bid on an open task

Usage:
  node scripts/task-bid.js --task-id <id> --price <usdc> --time <hours>

Options:
  --task-id    Task ID to bid on (required)
  --price      Bid price in USDC (required)
  --time       Estimated delivery time in hours (default: 24)
  --onchain    Submit bid to smart contract
  --json       Output JSON

Example:
  node scripts/task-bid.js --task-id task-001 --price 75.00 --time 48
  node scripts/task-bid.js --task-id task-001 --price 75.00 --onchain
`);
  process.exit(0);
}

// Validate required args
if (!values['task-id']) {
  console.error('❌ Error: --task-id is required');
  process.exit(1);
}

if (!values.price) {
  console.error('❌ Error: --price is required');
  process.exit(1);
}

const taskId = values['task-id'];
const bidPrice = parseFloat(values.price);
const estimatedHours = parseFloat(values.time);
const estimatedSeconds = Math.floor(estimatedHours * 3600);

if (isNaN(bidPrice) || bidPrice <= 0) {
  console.error('❌ Error: --price must be a positive number');
  process.exit(1);
}

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

  // Get bidder address
  let bidderAddress;
  if (values.onchain || config.privateKey) {
    try {
      const wallet = getWallet();
      bidderAddress = wallet.address;
    } catch (e) {
      bidderAddress = `agent-${Date.now()}`;
    }
  } else {
    bidderAddress = `agent-${Date.now()}`;
  }

  // Check if already bid
  const existingBid = task.bids?.find(b => b.bidder?.toLowerCase() === bidderAddress.toLowerCase());
  if (existingBid) {
    console.error(`❌ Error: You have already bid on this task (${existingBid.price} USDC)`);
    process.exit(1);
  }

  // Create bid object
  const bid = {
    bidder: bidderAddress,
    price: bidPrice.toFixed(2),
    estimatedTime: estimatedSeconds,
    estimatedHours: estimatedHours,
    timestamp: new Date().toISOString(),
    accepted: false,
  };

  // On-chain bid
  if (values.onchain) {
    if (!config.escrowAddress) {
      console.error('❌ Error: ESCROW_ADDRESS required for on-chain bidding');
      process.exit(1);
    }

    try {
      console.log(`📤 Submitting bid on-chain...`);
      const result = await bidOnTaskOnChain(taskId, bidPrice, estimatedSeconds);
      bid.txHash = result.txHash;
      console.log(`✅ Bid submitted on-chain: ${result.txHash}`);
    } catch (error) {
      console.error(`❌ On-chain bid failed: ${error.message}`);
      process.exit(1);
    }
  }

  // Save bid locally
  addBidToTask(taskId, bid);

  // Output
  if (values.json) {
    console.log(JSON.stringify({ taskId, bid, task: getTask(taskId) }, null, 2));
  } else {
    console.log(`
🎯 Bid Placed Successfully!

  Task:        ${taskId}
  Your Bid:    ${bidPrice.toFixed(2)} USDC
  Est. Time:   ${estimatedHours} hours
  Bidder:      ${bidderAddress.slice(0, 10)}...
  ${bid.txHash ? `Tx Hash:     ${bid.txHash}` : ''}

${task.bounty && bidPrice < parseFloat(task.bounty) ? `💡 Your bid is ${((1 - bidPrice / parseFloat(task.bounty)) * 100).toFixed(0)}% below the posted bounty!` : ''}

Waiting for poster to accept your bid...
`);
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
