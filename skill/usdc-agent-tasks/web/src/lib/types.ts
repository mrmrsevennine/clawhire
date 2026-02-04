export type TaskStatus = 'open' | 'claimed' | 'submitted' | 'approved' | 'disputed';

export interface Task {
  id: string;
  title: string;
  description: string;
  bounty: number;
  status: TaskStatus;
  tags: string[];
  poster: string;
  posterFull: string;
  worker: string | null;
  workerFull: string | null;
  timePosted: string;
  createdAt: number;
  claimedAt?: number;
  submittedAt?: number;
  approvedAt?: number;
  deliverable?: string;
}

export interface Agent {
  rank: number;
  address: string;
  tier: '🆕' | '🥉' | '🥈' | '🥇' | '💎';
  tierName: 'New' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  completed: number;
  earned: number;
  rate: number;
}

export interface StatusConfig {
  label: string;
  bg: string;
  textColor: string;
  pulse: string;
}

export const STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  open:      { label: '🟢 OPEN',      bg: 'bg-brutal-green',  textColor: 'text-brutal-black',  pulse: 'animate-pulse-open' },
  claimed:   { label: '🟡 CLAIMED',   bg: 'bg-brutal-yellow', textColor: 'text-brutal-black',  pulse: '' },
  submitted: { label: '🔵 SUBMITTED', bg: 'bg-brutal-blue',   textColor: 'text-brutal-black',  pulse: '' },
  approved:  { label: '✅ APPROVED',  bg: 'bg-brutal-purple', textColor: 'text-brutal-black',  pulse: '' },
  disputed:  { label: '🔴 DISPUTED',  bg: 'bg-brutal-pink',   textColor: 'text-white',         pulse: 'animate-pulse-red' },
};

export const CARD_COLORS = [
  'bg-brutal-green',
  'bg-brutal-blue',
  'bg-brutal-yellow',
  'bg-brutal-purple',
  'bg-brutal-orange',
  'bg-brutal-pink',
] as const;
