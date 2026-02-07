import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';

// Contract config
const CONTRACT_ADDRESS = '0x42D7c6f615BDc0e55B63D49605d3a57150590E8A';
const RPC_URL = 'https://sepolia.base.org';

// Minimal ABI for the events we care about
const TASK_ESCROW_ABI = [
  'event TaskCreated(bytes32 indexed taskId, address indexed poster, uint256 bounty, bytes32 parentTaskId)',
  'event TaskBid(bytes32 indexed taskId, address indexed bidder, uint256 price, uint256 estimatedTime)',
  'event BidAccepted(bytes32 indexed taskId, address indexed bidder, uint256 price)',
  'event TaskClaimed(bytes32 indexed taskId, address indexed worker)',
  'event DeliverableSubmitted(bytes32 indexed taskId, bytes32 deliverableHash)',
  'event TaskApproved(bytes32 indexed taskId, address indexed worker, uint256 workerPayout, uint256 platformFee)',
  'event TaskDisputed(bytes32 indexed taskId)',
  'event TaskCancelled(bytes32 indexed taskId, address indexed poster)',
];

interface ActivityEvent {
  id: string;
  type: 'TaskCreated' | 'TaskBid' | 'BidAccepted' | 'TaskClaimed' | 'DeliverableSubmitted' | 'TaskApproved' | 'TaskDisputed' | 'TaskCancelled';
  taskId: string;
  address?: string;
  amount?: number;
  timestamp: number;
  txHash: string;
}

const EVENT_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  TaskCreated: { icon: '📝', label: 'Task Posted', color: 'text-teal-600' },
  TaskBid: { icon: '🎯', label: 'Bid Placed', color: 'text-amber-600' },
  BidAccepted: { icon: '✅', label: 'Bid Accepted', color: 'text-emerald-600' },
  TaskClaimed: { icon: '🙋', label: 'Task Claimed', color: 'text-blue-600' },
  DeliverableSubmitted: { icon: '📦', label: 'Work Submitted', color: 'text-purple-600' },
  TaskApproved: { icon: '🎉', label: 'Task Approved', color: 'text-green-600' },
  TaskDisputed: { icon: '⚠️', label: 'Task Disputed', color: 'text-red-600' },
  TaskCancelled: { icon: '❌', label: 'Task Cancelled', color: 'text-gray-500' },
};

// Fallback events when we can't fetch from chain
const FALLBACK_EVENTS: ActivityEvent[] = [
  {
    id: '1',
    type: 'TaskCreated',
    taskId: '0x8a23...f1c2',
    address: '0x742d...89aF',
    amount: 50,
    timestamp: Date.now() - 1000 * 60 * 15,
    txHash: '0x1234',
  },
  {
    id: '2',
    type: 'TaskBid',
    taskId: '0x8a23...f1c2',
    address: '0xd8dA...4562',
    amount: 45,
    timestamp: Date.now() - 1000 * 60 * 12,
    txHash: '0x2345',
  },
  {
    id: '3',
    type: 'BidAccepted',
    taskId: '0x8a23...f1c2',
    address: '0xd8dA...4562',
    amount: 45,
    timestamp: Date.now() - 1000 * 60 * 8,
    txHash: '0x3456',
  },
  {
    id: '4',
    type: 'TaskCreated',
    taskId: '0x3b9c...e4a1',
    address: '0x1234...5678',
    amount: 75,
    timestamp: Date.now() - 1000 * 60 * 5,
    txHash: '0x4567',
  },
  {
    id: '5',
    type: 'TaskApproved',
    taskId: '0xf9e2...a8b3',
    address: '0xabcd...ef01',
    amount: 25,
    timestamp: Date.now() - 1000 * 60 * 2,
    txHash: '0x5678',
  },
];

function shortenAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortenTaskId(taskId: string): string {
  if (taskId.length <= 12) return taskId;
  return `${taskId.slice(0, 6)}...${taskId.slice(-4)}`;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatUsdc(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, TASK_ESCROW_ABI, provider);
        
        // Get recent block range (last ~1000 blocks ≈ 2-3 hours on Base)
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 1000);
        
        // Fetch all event types
        const eventTypes = [
          'TaskCreated',
          'TaskBid',
          'BidAccepted', 
          'TaskClaimed',
          'DeliverableSubmitted',
          'TaskApproved',
          'TaskDisputed',
          'TaskCancelled',
        ];
        
        const allEvents: ActivityEvent[] = [];
        
        for (const eventType of eventTypes) {
          try {
            const filter = contract.filters[eventType]();
            const logs = await contract.queryFilter(filter, fromBlock, currentBlock);
            
            for (const log of logs) {
              const block = await log.getBlock();
              const parsed = contract.interface.parseLog({
                topics: log.topics as string[],
                data: log.data,
              });
              
              if (parsed) {
                let amount: number | undefined;
                let address: string | undefined;
                
                // Extract amount based on event type
                if (eventType === 'TaskCreated' && parsed.args.bounty) {
                  amount = Number(ethers.formatUnits(parsed.args.bounty, 6));
                } else if ((eventType === 'TaskBid' || eventType === 'BidAccepted') && parsed.args.price) {
                  amount = Number(ethers.formatUnits(parsed.args.price, 6));
                } else if (eventType === 'TaskApproved' && parsed.args.workerPayout) {
                  amount = Number(ethers.formatUnits(parsed.args.workerPayout, 6));
                }
                
                // Extract address
                if (parsed.args.poster) {
                  address = parsed.args.poster;
                } else if (parsed.args.bidder) {
                  address = parsed.args.bidder;
                } else if (parsed.args.worker) {
                  address = parsed.args.worker;
                }
                
                allEvents.push({
                  id: `${log.transactionHash}-${log.index}`,
                  type: eventType as ActivityEvent['type'],
                  taskId: parsed.args.taskId || '',
                  address,
                  amount,
                  timestamp: block ? block.timestamp * 1000 : Date.now(),
                  txHash: log.transactionHash,
                });
              }
            }
          } catch (e) {
            // Skip individual event type errors
            console.warn(`Failed to fetch ${eventType} events:`, e);
          }
        }
        
        // Sort by timestamp descending, take last 10
        allEvents.sort((a, b) => b.timestamp - a.timestamp);
        
        if (allEvents.length > 0) {
          setEvents(allEvents.slice(0, 10));
          setError(null);
        } else {
          // No events found, use fallback
          setEvents(FALLBACK_EVENTS);
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError('Using demo data');
        setEvents(FALLBACK_EVENTS);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cream-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="inline-block px-3 py-1 text-xs font-medium bg-teal-100 text-teal-700 rounded-full mb-4">
            Live On-Chain
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-bark-900 mb-3">
            Recent Activity
          </h2>
          <p className="text-bark-500 text-base max-w-lg mx-auto">
            Real-time events from the clawhire marketplace on Base Sepolia
          </p>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-teal-300 via-teal-200 to-transparent" />
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {events.map((event, index) => {
                  const config = EVENT_CONFIG[event.type];
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative pl-14"
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-4 w-4 h-4 rounded-full bg-cream-50 border-2 border-teal-400 shadow-sm flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                      </div>
                      
                      {/* Event card */}
                      <div className="bg-white rounded-xl border border-sand-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{config.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${config.color}`}>
                                  {config.label}
                                </span>
                                {event.amount && (
                                  <span className="text-sm font-semibold text-bark-900">
                                    {formatUsdc(event.amount)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-bark-400 mt-0.5">
                                <span className="font-mono">
                                  {shortenTaskId(event.taskId)}
                                </span>
                                {event.address && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono">
                                      {shortenAddress(event.address)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-bark-400">
                              {timeAgo(event.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
          
          {/* Info badge */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-6"
            >
              <span className="inline-flex items-center gap-1.5 text-xs text-bark-400 bg-sand-100 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {error}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Footer link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <a
            href="https://sepolia.basescan.org/address/0x42D7c6f615BDc0e55B63D49605d3a57150590E8A#events"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            View all events on BaseScan
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
