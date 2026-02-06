export type TaskStatus = 'open' | 'claimed' | 'submitted' | 'approved' | 'disputed' | 'refunded' | 'cancelled';

export interface Bid {
  bidder: string;
  bidderFull: string;
  price: number;
  estimatedHours: number;
  timestamp: number;
  accepted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  bounty: number;
  agreedPrice?: number;
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
  bids?: Bid[];
  bidCount?: number;
  parentTaskId?: string;
  subtasks?: string[];
  onchain?: boolean;
  txHash?: string;
}

export type TierEmoji = '🆕' | '🥉' | '🥈' | '🥇' | '💎';
export type TierName = 'New' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond';

export interface Agent {
  rank: number;
  address: string;
  addressFull: string;
  tier: TierEmoji;
  tierName: TierName;
  completed: number;
  earned: number;
  spent: number;
  rate: number;
  avgDeliveryTime?: number;
}

export interface StatusConfig {
  label: string;
  icon: string;
  bg: string;
  border: string;
  text: string;
}

export const STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  open:      { label: 'Open',      icon: '●', bg: 'bg-status-open/10',     border: 'border-status-open/30',     text: 'text-status-open' },
  claimed:   { label: 'Claimed',   icon: '◐', bg: 'bg-status-claimed/10',  border: 'border-status-claimed/30',  text: 'text-status-claimed' },
  submitted: { label: 'Submitted', icon: '◑', bg: 'bg-status-submitted/10',border: 'border-status-submitted/30',text: 'text-status-submitted' },
  approved:  { label: 'Approved',  icon: '✓', bg: 'bg-status-approved/10', border: 'border-status-approved/30', text: 'text-status-approved' },
  disputed:  { label: 'Disputed',  icon: '!', bg: 'bg-status-disputed/10', border: 'border-status-disputed/30', text: 'text-status-disputed' },
  refunded:  { label: 'Refunded',  icon: '↩', bg: 'bg-sand-100',          border: 'border-sand-200',          text: 'text-sand-500' },
  cancelled: { label: 'Cancelled', icon: '✕', bg: 'bg-sand-100',          border: 'border-sand-200',          text: 'text-sand-500' },
};

export const TIER_CONFIG: Record<TierName, { emoji: TierEmoji; color: string; bg: string }> = {
  New:     { emoji: '🆕', color: 'text-sand-400',       bg: 'bg-sand-100' },
  Bronze:  { emoji: '🥉', color: 'text-amber-700',      bg: 'bg-amber-50' },
  Silver:  { emoji: '🥈', color: 'text-sand-500',       bg: 'bg-sand-200' },
  Gold:    { emoji: '🥇', color: 'text-amber-600',      bg: 'bg-amber-50' },
  Diamond: { emoji: '💎', color: 'text-accent-700',     bg: 'bg-accent-50' },
};

export interface PlatformStats {
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
  totalVolume: number;
  feesCollected: number;
  activeAgents: number;
  totalBids: number;
}
