// Local JSON storage for tasks and reputation
// Stores data in ~/.openclaw/agent-tasks/

const fs = require('fs');
const path = require('path');
const { config } = require('./config');

const TASKS_FILE = path.join(config.dataDir, 'tasks.json');
const REPUTATION_FILE = path.join(config.dataDir, 'reputation.json');

function ensureDir() {
  fs.mkdirSync(config.dataDir, { recursive: true });
}

// --- Task Storage ---

function loadTasks() {
  ensureDir();
  if (!fs.existsSync(TASKS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveTasks(tasks) {
  ensureDir();
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

function getTask(taskId) {
  const tasks = loadTasks();
  return tasks[taskId] || null;
}

function saveTask(taskId, taskData) {
  const tasks = loadTasks();
  tasks[taskId] = { ...tasks[taskId], ...taskData, updatedAt: new Date().toISOString() };
  saveTasks(tasks);
  return tasks[taskId];
}

function listTasks(filter = {}) {
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

  return entries.map(([id, t]) => ({ id, ...t }));
}

function deleteTask(taskId) {
  const tasks = loadTasks();
  delete tasks[taskId];
  saveTasks(tasks);
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

function getReputation(address) {
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
    history: [],
  };
}

function updateReputation(address, update) {
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

module.exports = {
  loadTasks,
  saveTasks,
  getTask,
  saveTask,
  listTasks,
  deleteTask,
  getReputation,
  updateReputation,
};
