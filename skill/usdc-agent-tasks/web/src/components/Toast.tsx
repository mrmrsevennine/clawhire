import { useEffect, useState } from 'react';
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  txHash?: string;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    return id;
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  updateToast: (id, updates) =>
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
}));

// Helper functions for common toasts
export const toast = {
  success: (message: string, txHash?: string) => {
    const id = useToast.getState().addToast({ type: 'success', message, txHash });
    setTimeout(() => useToast.getState().removeToast(id), 5000);
    return id;
  },
  error: (message: string) => {
    const id = useToast.getState().addToast({ type: 'error', message });
    setTimeout(() => useToast.getState().removeToast(id), 6000);
    return id;
  },
  info: (message: string) => {
    const id = useToast.getState().addToast({ type: 'info', message });
    setTimeout(() => useToast.getState().removeToast(id), 4000);
    return id;
  },
  loading: (message: string) => {
    return useToast.getState().addToast({ type: 'loading', message });
  },
  dismiss: (id: string) => useToast.getState().removeToast(id),
  update: (id: string, updates: Partial<Toast>) => useToast.getState().updateToast(id, updates),
};

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  loading: '◌',
};

const COLORS: Record<ToastType, string> = {
  success: 'bg-status-approved/20 border-status-approved/40 text-status-approved',
  error: 'bg-status-disputed/20 border-status-disputed/40 text-status-disputed',
  info: 'bg-usdc-500/20 border-usdc-500/40 text-usdc-400',
  loading: 'bg-dark-700 border-dark-600 text-dark-300',
};

function ToastItem({ toast: t, onClose }: { toast: Toast; onClose: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-lg
        transition-all duration-200
        ${COLORS[t.type]}
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
      `}
    >
      <span className={`text-lg ${t.type === 'loading' ? 'animate-spin' : ''}`}>
        {ICONS[t.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm">{t.message}</p>
        {t.txHash && (
          <a
            href={`https://amoy.polygonscan.com/tx/${t.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs underline hover:no-underline mt-1 block"
          >
            View on PolygonScan
          </a>
        )}
      </div>
      {t.type !== 'loading' && (
        <button
          onClick={handleClose}
          className="text-current opacity-60 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
