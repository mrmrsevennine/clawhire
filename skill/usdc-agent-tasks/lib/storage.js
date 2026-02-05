// Local JSON storage for tasks and reputation
// Stores data in ~/.openclaw/agent-tasks/

import fs from 'fs';
import path from 'path';
import { config } from './config.js';

const TASKS_FILE = path.join(config.dataDir, 'tasks.json');
const REPUTATION_FILE = path.join(config.dataDir, 'reputation.json');

function ensureDir() {
  fs.mkdirSync(config.dataDir, { recursive: true });
}

// --- Task Storage ---

export function loadTasks() {
  ensureDir();
  if (!fs.existsSync(TASKS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

export function saveTasks(tasks) {
  ensureDir();
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

export function getTask(taskId) {
  const tasks = loadTasks();
  return tasks[taskId] || null;
}

export function saveTask(taskId, taskData) {
  const tasks = loadTasks();
  tasks[taskId] = { ...tasks[taskId], ...taskData, updatedAt: new Date().toISOString() };
  saveTasks(tasks);
  return tasks[taskId];
}

export function listTasks(filter = {}) {
  const tasks = loadTasks();
  let entries = Object.entries(tasks);

  if (filter.status) {
    entries = entries.filter(([, t]) => t.status === filter.status);
  }
  if (filter.poster) {
    entries = entries.filter(([, t]) => t.poster?.toLowerCase() === filter.poster.toLowerCase());
  }
  if (filter.worker) {
    entries = entries.filter(([, t]) => t.worker?.toLowerCase() === filter.worker.toLowerCase());
  }
  if (filter.parentTaskId) {
    entries = entries.filter(([, t]) => t.parentTaskId === filter.parentTaskId);
  }
  if (filter.hasBids) {
    entries = entries.filter(([, t]) => (t.bids?.length || 0) > 0);
  }

  return entries.map(([id, t]) => ({ id, ...t }));
}

export function deleteTask(taskId) {
  const tasks = loadTasks();
  delete tasks[taskId];
  saveTasks(tasks);
}

// --- Bid Storage (within tasks) ---

export function addBidToTask(taskId, bid) {
  const tasks = loadTasks();
  const task = tasks[taskId];
  if (!task) return null;

  task.bids = task.bids || [];
  // Check if bidder already bid
  const existingIndex = task.bids.findIndex(b => b.bidder?.toLowerCase() === bid.bidder?.toLowerCase());
  if (existingIndex >= 0) {
    task.bids[existingIndex] = { ...task.bids[existingIndex], ...bid };
  } else {
    task.bids.push(bid);
  }

  task.bidCount = task.bids.length;
  task.updatedAt = new Date().toISOString();
  saveTasks(tasks);
  return task;
}

export function getBidsForTask(taskId) {
  const task = getTask(taskId);
  return task?.bids || [];
}

export function acceptBidInTask(taskId, bidderAddress) {
  const tasks = loadTasks();
  const task = tasks[taskId];
  if (!task || !task.bids) return null;

  const bid = task.bids.find(b => b.bidder?.toLowerCase() === bidderAddress.toLowerCase());
  if (!bid) return null;

  bid.accepted = true;
  task.worker = bidderAddress;
  task.agreedPrice = bid.price;
  task.status = 'claimed';
  task.claimedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();

  saveTasks(tasks);
  return task;
}

// --- Reputation Storage ---

function loadReputation() {
  ensureDir();
  if (!fs.existsSync(REPUTATION_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(REPUTATION_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveReputation(rep) {
  ensureDir();
  fs.writeFileSync(REPUTATION_FILE, JSON.stringify(rep, null, 2));
}

export function getReputation(address) {
  const rep = loadReputation();
  const addr = address.toLowerCase();
  return rep[addr] || {
    address: addr,
    tasksPosted: 0,
    tasksCompleted: 0,
    tasksDisputed: 0,
    totalEarned: '0',
    totalSpent: '0',
    completionRate: 0,
    avgDeliveryTime: 0,
    history: [],
  };
}

export function updateReputation(address, update) {
  const rep = loadReputation();
  const addr = address.toLowerCase();
  const current = rep[addr] || {
    address: addr,
    tasksPosted: 0,
    tasksCompleted: 0,
    tasksDisputed: 0,
    totalEarned: '0',
    totalSpent: '0',
    completionRate: 0,
    avgDeliveryTime: 0,
    history: [],
  };

  // Merge numeric fields
  if (update.tasksPosted) current.tasksPosted += update.tasksPosted;
  if (update.tasksCompleted) current.tasksCompleted += update.tasksCompleted;
  if (update.tasksDisputed) current.tasksDisputed += update.tasksDisputed;
  if (update.earned) {
    current.totalEarned = (parseFloat(current.totalEarned) + parseFloat(update.earned)).toFixed(6);
  }
  if (update.spent) {
    current.totalSpent = (parseFloat(current.totalSpent) + parseFloat(update.spent)).toFixed(6);
  }

  // Update completion rate
  const total = current.tasksCompleted + current.tasksDisputed;
  current.completionRate = total > 0 ? Math.round((current.tasksCompleted / total) * 100) : 0;

  // Add history entry
  if (update.event) {
    current.history.push({
      event: update.event,
      taskId: update.taskId,
      amount: update.amount,
      timestamp: new Date().toISOString(),
    });
    // Keep last 100 entries
    if (current.history.length > 100) {
      current.history = current.history.slice(-100);
    }
  }

  rep[addr] = current;
  saveReputation(rep);
  return current;
}

export function getAllReputations() {
  return loadReputation();
}

export function getLeaderboard(sortBy = 'tasksCompleted', limit = 10) {
  const rep = loadReputation();
  const entries = Object.values(rep);

  entries.sort((a, b) => {
    if (sortBy === 'earned') {
      return parseFloat(b.totalEarned) - parseFloat(a.totalEarned);
    }
    return (b[sortBy] || 0) - (a[sortBy] || 0);
  });

  return entries.slice(0, limit);
}

// Export for default import
export default {
  loadTasks,
  saveTasks,
  getTask,
  saveTask,
  listTasks,
  deleteTask,
  addBidToTask,
  getBidsForTask,
  acceptBidInTask,
  getReputation,
  updateReputation,
  getAllReputations,
  getLeaderboard,
};
