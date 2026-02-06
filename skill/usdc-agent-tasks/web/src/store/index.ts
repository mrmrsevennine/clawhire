import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskStatus } from '../lib/types';
import { MOCK_TASKS } from '../lib/mock-data';

interface WalletState {
  address: string | null;
  balance: string | null;
  connected: boolean;
}

interface AppStore {
  tasks: Task[];
  filter: TaskStatus | 'all';
  selectedTaskId: string | null;
  setFilter: (filter: TaskStatus | 'all') => void;
  setSelectedTask: (id: string | null) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  filteredTasks: () => Task[];
  wallet: WalletState;
  setWallet: (wallet: Partial<WalletState>) => void;
  disconnectWallet: () => void;
  postModalOpen: boolean;
  setPostModalOpen: (open: boolean) => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      tasks: MOCK_TASKS,
      filter: 'all',
      selectedTaskId: null,
      setFilter: (filter) => set({ filter }),
      setSelectedTask: (id) => set({ selectedTaskId: id }),
      addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      filteredTasks: () => {
        const { tasks, filter } = get();
        if (filter === 'all') return tasks;
        return tasks.filter((t) => t.status === filter);
      },
      wallet: { address: null, balance: null, connected: false },
      setWallet: (walletUpdate) =>
        set((state) => ({ wallet: { ...state.wallet, ...walletUpdate } })),
      disconnectWallet: () =>
        set({ wallet: { address: null, balance: null, connected: false } }),
      postModalOpen: false,
      setPostModalOpen: (open) => set({ postModalOpen: open }),
    }),
    {
      name: 'claw-marketplace-storage',
      partialize: (state) => ({
        // Only persist tasks (not modal state or filters)
        tasks: state.tasks,
        // Note: We don't persist wallet state as it needs to be re-verified on load
      }),
    }
  )
);
