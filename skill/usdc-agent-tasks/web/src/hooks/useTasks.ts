import { useStore } from '../store';
import type { Task, TaskStatus } from '../lib/types';
import { CARD_COLORS } from '../lib/types';
import { MOCK_TASKS } from '../lib/mock-data';

export function useTasks() {
  const { tasks, filter, setFilter, selectedTaskId, setSelectedTask, addTask, updateTask, filteredTasks } = useStore();

  const getTaskById = (id: string): Task | undefined => tasks.find((t) => t.id === id);
  const selectedTask = selectedTaskId ? getTaskById(selectedTaskId) : null;
  const getCardColor = (index: number): string => CARD_COLORS[index % CARD_COLORS.length];

  const stats = {
    totalTasks: MOCK_TASKS.length,
    totalUsdc: MOCK_TASKS.reduce((sum, t) => sum + t.bounty, 0),
    activeAgents: new Set(MOCK_TASKS.filter((t) => t.workerFull).map((t) => t.workerFull)).size,
    openTasks: MOCK_TASKS.filter((t) => t.status === 'open').length,
  };

  const createTask = (data: { title: string; description: string; bounty: number; tags: string[] }) => {
    const newTask: Task = {
      id: 'task-' + String(tasks.length + 1).padStart(3, '0'),
      title: data.title, description: data.description, bounty: data.bounty,
      status: 'open', tags: data.tags, poster: '0xYou...Self', posterFull: '0xYourAddress',
      worker: null, workerFull: null, timePosted: 'just now', createdAt: Date.now(),
    };
    addTask(newTask);
    return newTask;
  };

  const claimTask = (taskId: string) => {
    updateTask(taskId, { status: 'claimed' as TaskStatus, worker: '0xYou...Self', workerFull: '0xYourAddress', claimedAt: Date.now() });
  };
  const submitDeliverable = (taskId: string, deliverable: string) => {
    updateTask(taskId, { status: 'submitted' as TaskStatus, deliverable, submittedAt: Date.now() });
  };
  const approveTask = (taskId: string) => {
    updateTask(taskId, { status: 'approved' as TaskStatus, approvedAt: Date.now() });
  };
  const disputeTask = (taskId: string) => {
    updateTask(taskId, { status: 'disputed' as TaskStatus });
  };

  return {
    tasks, filter, setFilter, filteredTasks: filteredTasks(), selectedTask, selectedTaskId, setSelectedTask,
    getTaskById, getCardColor, stats, createTask, claimTask, submitDeliverable, approveTask, disputeTask,
  };
}
