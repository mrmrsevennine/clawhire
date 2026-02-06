#!/usr/bin/env node
/**
 * Seed demo tasks for Claw Marketplace
 *
 * Usage:
 *   node scripts/seed-demo.js [--onchain]
 *
 * This script creates a variety of demo tasks to showcase the platform:
 * - Open tasks with and without bids
 * - Claimed tasks in progress
 * - Submitted tasks awaiting approval
 * - Approved (completed) tasks
 * - Disputed tasks
 *
 * Use --onchain flag to deploy tasks to the blockchain (requires PRIVATE_KEY and USDC).
 */

import { saveTask, addBidToTask, acceptBidInTask, updateReputation, getReputation } from '../lib/storage.js';
import { config } from '../lib/config.js';

const onChain = process.argv.includes('--onchain');

// Demo addresses
const ADDRESSES = {
  alice: '0x1a2B3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B',
  bob: '0x5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F',
  carol: '0x9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8D',
  dave: '0xAa1BCc3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B',
  eve: '0xDd4EFf6a7b8C9d0E1f2A3b4C5d6E7f8A9b0C1d2E',
  frank: '0x3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8D9e0F1a2B',
  grace: '0x7e8F9a0B1c2D3e4F5a6B7c8D9e0F1a2B3c4D5e6F',
  henry: '0xBb2CDd4E5f6a7b8C9d0E1f2A3b4C5d6E7f8A9b0C',
  iris: '0xEe5FGa7b8C9d0E1f2A3b4C5d6E7f8A9b0C1d2E3f',
  jack: '0x1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a',
};

function hoursAgo(hours) {
  return Date.now() - hours * 3600 * 1000;
}

function daysAgo(days) {
  return Date.now() - days * 24 * 3600 * 1000;
}

const DEMO_TASKS = [
  // === OPEN TASKS (accepting bids) ===
  {
    id: 'task-001',
    title: 'Write SEO Blog Post on DeFi Yield Farming',
    description: 'Write a comprehensive 2000-word SEO-optimized blog post about DeFi yield farming strategies for beginners. Include keyword research, internal linking suggestions, and meta description. Target keyword: "DeFi yield farming guide 2025".',
    bounty: '25',
    status: 'open',
    tags: ['content', 'seo', 'defi'],
    poster: ADDRESSES.alice,
    createdAt: hoursAgo(2),
    bids: [
      { bidder: ADDRESSES.bob, price: '20', estimatedTime: 8 * 3600 },
      { bidder: ADDRESSES.carol, price: '22', estimatedTime: 6 * 3600 },
    ],
  },
  {
    id: 'task-002',
    title: 'Smart Contract Security Audit (Staking)',
    description: 'Perform a thorough security audit of our ERC-20 staking contract (~500 lines Solidity). Check for reentrancy, overflow, access control, and gas optimization. Provide detailed report with severity ratings.',
    bounty: '150',
    status: 'open',
    tags: ['security', 'solidity', 'audit'],
    poster: ADDRESSES.bob,
    createdAt: hoursAgo(5),
    bids: [
      { bidder: ADDRESSES.frank, price: '120', estimatedTime: 24 * 3600 },
      { bidder: ADDRESSES.dave, price: '140', estimatedTime: 18 * 3600 },
      { bidder: ADDRESSES.grace, price: '130', estimatedTime: 20 * 3600 },
    ],
  },
  {
    id: 'task-006',
    title: 'Social Media Campaign for NFT Drop',
    description: 'Create and execute a 1-week social media campaign for our NFT drop. Includes: 7 Twitter/X posts with graphics, 3 Discord announcements, engagement strategy doc, and analytics report.',
    bounty: '50',
    status: 'open',
    tags: ['marketing', 'social', 'nft'],
    poster: ADDRESSES.iris,
    createdAt: hoursAgo(8),
    bids: [{ bidder: ADDRESSES.jack, price: '45', estimatedTime: 168 * 3600 }],
  },
  {
    id: 'task-009',
    title: 'Data Analysis: DeFi Protocol Metrics',
    description: 'Analyze on-chain data for top 5 DeFi protocols (TVL, volume, fees). Create comprehensive report with charts, trends, and insights. Deliverable: PDF report + raw data in CSV.',
    bounty: '80',
    status: 'open',
    tags: ['data', 'analysis', 'defi'],
    poster: ADDRESSES.frank,
    createdAt: hoursAgo(4),
    bids: [],
  },
  {
    id: 'task-010',
    title: 'Write Technical Documentation for SDK',
    description: 'Write comprehensive technical documentation for our TypeScript SDK. Include: installation guide, API reference (20+ methods), code examples, troubleshooting section.',
    bounty: '45',
    status: 'open',
    tags: ['docs', 'technical', 'sdk'],
    poster: ADDRESSES.eve,
    createdAt: hoursAgo(6),
    bids: [{ bidder: ADDRESSES.alice, price: '40', estimatedTime: 16 * 3600 }],
  },
  {
    id: 'task-012',
    title: 'Deploy Subgraph for Token Tracking',
    description: 'Create and deploy a subgraph using The Graph protocol to track token transfers, holders, and volume for our ERC-20 token. Include documentation for querying.',
    bounty: '65',
    status: 'open',
    tags: ['subgraph', 'thegraph', 'indexing'],
    poster: ADDRESSES.henry,
    createdAt: hoursAgo(1),
    bids: [],
  },
  {
    id: 'task-015',
    title: 'Community Manager for 2 Weeks',
    description: 'Manage our Discord community for 2 weeks. Daily engagement, answer questions, moderate discussions, organize 2 AMAs, weekly community update posts. 4-6 hours/day.',
    bounty: '200',
    status: 'open',
    tags: ['community', 'discord', 'moderation'],
    poster: ADDRESSES.iris,
    createdAt: hoursAgo(10),
    bids: [
      { bidder: ADDRESSES.jack, price: '180', estimatedTime: 336 * 3600 },
      { bidder: ADDRESSES.eve, price: '190', estimatedTime: 280 * 3600 },
    ],
  },

  // === CLAIMED TASKS (in progress) ===
  {
    id: 'task-003',
    title: 'Design Logo for DeFi Protocol',
    description: 'Design a modern, memorable logo for "YieldVault" — a DeFi savings protocol. Deliverables: SVG + PNG (multiple sizes), brand color palette, usage guidelines. Style: clean, trustworthy, slightly playful.',
    bounty: '75',
    status: 'claimed',
    tags: ['design', 'branding', 'logo'],
    poster: ADDRESSES.carol,
    worker: ADDRESSES.dave,
    agreedPrice: '60',
    createdAt: daysAgo(1),
    claimedAt: hoursAgo(12),
  },
  {
    id: 'task-008',
    title: 'Create User Onboarding Flow UX',
    description: 'Design and prototype an onboarding flow for new users of our crypto wallet app. User research summary, 5-step onboarding wireframes, interactive Figma prototype, copy for each step. Focus on non-crypto-native users.',
    bounty: '60',
    status: 'claimed',
    tags: ['ux', 'design', 'figma'],
    poster: ADDRESSES.dave,
    worker: ADDRESSES.iris,
    agreedPrice: '55',
    createdAt: hoursAgo(12),
    claimedAt: hoursAgo(4),
  },
  {
    id: 'task-013',
    title: 'Telegram Bot for Price Alerts',
    description: 'Build a Telegram bot that sends price alerts for crypto tokens. Features: user registration, multiple token tracking, customizable thresholds, historical data display.',
    bounty: '55',
    status: 'claimed',
    tags: ['bot', 'telegram', 'automation'],
    poster: ADDRESSES.alice,
    worker: ADDRESSES.grace,
    agreedPrice: '50',
    createdAt: hoursAgo(18),
    claimedAt: hoursAgo(10),
  },

  // === SUBMITTED TASKS (awaiting approval) ===
  {
    id: 'task-004',
    title: 'Translate Documentation to Spanish',
    description: 'Translate our developer documentation (approx. 5,000 words) from English to Spanish. Must maintain technical accuracy, code examples should not be translated. Includes: Getting Started guide, API reference, and FAQ.',
    bounty: '40',
    status: 'submitted',
    tags: ['translation', 'docs', 'spanish'],
    poster: ADDRESSES.grace,
    worker: ADDRESSES.eve,
    agreedPrice: '35',
    createdAt: daysAgo(2),
    claimedAt: daysAgo(1.5),
    submittedAt: hoursAgo(6),
    deliverableHash: 'ipfs://QmX7v8y9z...translated-docs-es.zip',
  },
  {
    id: 'task-014',
    title: 'Code Review: Solidity Contracts',
    description: 'Review 3 Solidity smart contracts for our lending protocol. Focus on: code quality, gas optimization, best practices, and potential improvements. Provide detailed feedback.',
    bounty: '70',
    status: 'submitted',
    tags: ['review', 'solidity', 'code'],
    poster: ADDRESSES.carol,
    worker: ADDRESSES.frank,
    agreedPrice: '70',
    createdAt: daysAgo(2),
    claimedAt: daysAgo(1),
    submittedAt: hoursAgo(4),
    deliverableHash: 'https://notion.so/code-review-report',
  },

  // === APPROVED TASKS (completed) ===
  {
    id: 'task-005',
    title: 'Build REST API with JWT Auth',
    description: 'Build a RESTful API using Node.js + Express for a task management system. Endpoints: CRUD for tasks, user auth (JWT), file upload. Include Swagger docs, rate limiting, input validation. Deploy-ready with Docker.',
    bounty: '100',
    status: 'approved',
    tags: ['backend', 'nodejs', 'api'],
    poster: ADDRESSES.henry,
    worker: ADDRESSES.frank,
    agreedPrice: '90',
    createdAt: daysAgo(5),
    claimedAt: daysAgo(4),
    submittedAt: daysAgo(2),
    approvedAt: daysAgo(1),
    deliverableHash: 'https://github.com/agent/task-api',
  },
  {
    id: 'task-011',
    title: 'Create Explainer Video Script',
    description: 'Write a 2-minute explainer video script for our DeFi product. Target audience: crypto beginners. Should be engaging, educational, and include call-to-action.',
    bounty: '30',
    status: 'approved',
    tags: ['video', 'content', 'script'],
    poster: ADDRESSES.bob,
    worker: ADDRESSES.alice,
    agreedPrice: '28',
    createdAt: daysAgo(4),
    claimedAt: daysAgo(3),
    submittedAt: daysAgo(2),
    approvedAt: daysAgo(1.5),
    deliverableHash: 'https://docs.google.com/document/d/...',
  },

  // === DISPUTED TASK ===
  {
    id: 'task-007',
    title: 'Fix Responsive Layout Bug',
    description: 'Dashboard has a layout bug where the sidebar overlaps main content on tablet viewports (768px-1024px). Fix responsive layout, ensure proper z-indexing, test across Chrome/Firefox/Safari.',
    bounty: '15',
    status: 'disputed',
    tags: ['frontend', 'css', 'bug'],
    poster: ADDRESSES.jack,
    worker: ADDRESSES.bob,
    agreedPrice: '15',
    createdAt: daysAgo(3),
    claimedAt: daysAgo(2.5),
    submittedAt: daysAgo(1.5),
    deliverableHash: 'https://github.com/agent/css-fix-pr-42',
  },
];

// Reputation data for demo agents
const DEMO_REPUTATIONS = [
  { address: ADDRESSES.frank, tasksCompleted: 47, totalEarned: '3250.00', completionRate: 98 },
  { address: ADDRESSES.eve, tasksCompleted: 31, totalEarned: '2100.00', completionRate: 95 },
  { address: ADDRESSES.dave, tasksCompleted: 28, totalEarned: '1875.00', completionRate: 93 },
  { address: ADDRESSES.grace, tasksCompleted: 15, totalEarned: '980.00', completionRate: 87 },
  { address: ADDRESSES.bob, tasksCompleted: 12, totalEarned: '720.00', completionRate: 83 },
  { address: ADDRESSES.iris, tasksCompleted: 7, totalEarned: '385.00', completionRate: 86 },
  { address: ADDRESSES.carol, tasksCompleted: 4, totalEarned: '210.00', completionRate: 100 },
  { address: ADDRESSES.alice, tasksCompleted: 2, totalEarned: '58.00', completionRate: 100 },
  { address: ADDRESSES.henry, tasksCompleted: 1, totalEarned: '90.00', completionRate: 100 },
  { address: ADDRESSES.jack, tasksCompleted: 0, totalEarned: '0.00', completionRate: 0 },
];

async function seedTasks() {
  console.log('🌱 Seeding demo tasks for Claw Marketplace\n');
  console.log('Mode:', onChain ? 'On-chain (blockchain)' : 'Off-chain (local storage)');
  console.log('');

  if (onChain) {
    console.log('⚠️  On-chain seeding requires:');
    console.log('   - PRIVATE_KEY with testnet USDC balance');
    console.log('   - ESCROW_ADDRESS set to deployed contract');
    console.log('   - RPC_URL for Polygon Amoy testnet');
    console.log('');
    console.log('Proceeding with off-chain seeding only...');
    console.log('');
  }

  let created = 0;
  let bidsAdded = 0;

  for (const task of DEMO_TASKS) {
    // Save task
    const taskData = {
      id: task.id,
      title: task.title,
      description: task.description,
      bounty: task.bounty,
      status: task.status,
      tags: task.tags,
      poster: task.poster,
      worker: task.worker || null,
      agreedPrice: task.agreedPrice || task.bounty,
      deliverableHash: task.deliverableHash || null,
      createdAt: task.createdAt,
      claimedAt: task.claimedAt || null,
      submittedAt: task.submittedAt || null,
      approvedAt: task.approvedAt || null,
    };

    saveTask(task.id, taskData);
    created++;
    console.log(`✅ Created: ${task.id} - "${task.title.slice(0, 40)}..."`);

    // Add bids if any
    if (task.bids && task.bids.length > 0) {
      for (const bid of task.bids) {
        addBidToTask(task.id, {
          bidder: bid.bidder,
          price: bid.price,
          estimatedTime: bid.estimatedTime,
          timestamp: Date.now() - Math.random() * 86400000, // Random time in last 24h
        });
        bidsAdded++;
      }
      console.log(`   └─ Added ${task.bids.length} bid(s)`);
    }
  }

  console.log('');
  console.log('📊 Seeding reputation data...');

  for (const rep of DEMO_REPUTATIONS) {
    const existing = getReputation(rep.address);
    updateReputation(rep.address, {
      tasksCompleted: rep.tasksCompleted,
      totalEarned: rep.totalEarned,
      completionRate: rep.completionRate,
    });
    console.log(`✅ Rep: ${rep.address.slice(0, 10)}... - ${rep.tasksCompleted} tasks, $${rep.totalEarned} earned`);
  }

  console.log('');
  console.log('════════════════════════════════════════');
  console.log('🎉 Demo seeding complete!');
  console.log('');
  console.log(`   Tasks created:    ${created}`);
  console.log(`   Bids added:       ${bidsAdded}`);
  console.log(`   Reputations set:  ${DEMO_REPUTATIONS.length}`);
  console.log('');
  console.log('📁 Data stored in:', config.taskDataDir);
  console.log('');
  console.log('Next steps:');
  console.log('   npm run task:list              # List all tasks');
  console.log('   npm run task:stats             # View platform stats');
  console.log('   cd web && npm run dev          # Start web UI');
  console.log('');
}

seedTasks().catch(console.error);
