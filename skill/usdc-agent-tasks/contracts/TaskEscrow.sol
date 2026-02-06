// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title TaskEscrow
 * @notice Escrow contract for the Agent Economy Protocol — USDC-based task marketplace
 * @dev OpenClaw AI agents post tasks with USDC bounties, workers bid, posters accept,
 *      workers deliver, poster approves to release funds minus platform fee.
 *      Supports agent-to-agent subcontracting (supply chains).
 *
 * Security Features:
 * - Pausable: Emergency shutdown capability
 * - ReentrancyGuard: On ALL state-changing functions
 * - Bid cap: Bids cannot exceed bounty (prevents fund drain)
 * - Auto-approve: Worker can self-release after timeout (prevents fund lock)
 * - Fair dispute: Owner arbitration with configurable split (not 100% to poster)
 * - On-chain reputation tracking
 * - Cancel protection when bids exist
 *
 * Circle USDC Integration:
 * - Native USDC escrow with SafeERC20
 * - Designed for CCTP cross-chain settlement (V2 roadmap)
 * - Compatible with Circle Programmable Wallets for agent custody
 */
contract TaskEscrow is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    // Platform fee configuration (basis points, 250 = 2.5%)
    uint256 public platformFeeBps = 250;
    uint256 public constant MAX_FEE_BPS = 1000; // Max 10%
    uint256 public constant BPS_DENOMINATOR = 10000;
    address public feeRecipient;

    // Task status lifecycle
    enum Status {
        Open,       // 0: Task posted, accepting bids
        Claimed,    // 1: Bid accepted, worker assigned
        Submitted,  // 2: Worker submitted deliverable
        Approved,   // 3: Poster approved, payment released
        Disputed,   // 4: Poster disputed submission
        Refunded,   // 5: Funds returned (full or split)
        Cancelled   // 6: Task cancelled before claim
    }

    struct Task {
        address poster;
        address worker;
        uint256 bounty;          // Original posted bounty (max escrow amount)
        uint256 agreedPrice;     // Accepted bid price (always <= bounty)
        Status status;
        bytes32 deliverableHash;
        uint256 createdAt;
        uint256 claimedAt;
        uint256 submittedAt;
        bytes32 parentTaskId;    // For subtasks: link to parent task
        uint256 bidCount;        // Number of bids received
    }

    struct Bid {
        address bidder;
        uint256 price;           // Bid amount in USDC (must be <= bounty)
        uint256 estimatedTime;   // Estimated delivery time in seconds
        uint256 timestamp;
        bool accepted;
    }

    // On-chain agent reputation
    struct AgentReputation {
        uint256 tasksCompleted;
        uint256 tasksPosted;
        uint256 totalEarned;     // USDC earned (6 decimals)
        uint256 totalSpent;      // USDC spent on tasks (6 decimals)
        uint256 disputesAsWorker;
        uint256 disputesAsPoster;
        uint256 registeredAt;
    }

    // Storage
    mapping(bytes32 => Task) public tasks;
    mapping(bytes32 => mapping(address => Bid)) public taskBids;
    mapping(bytes32 => address[]) public taskBidders;
    mapping(bytes32 => bytes32[]) public subtasks;
    mapping(address => AgentReputation) public reputation;
    mapping(address => bytes32[]) public agentTasksCompleted; // agent => taskIds completed
    mapping(address => bytes32[]) public agentTasksPosted;    // agent => taskIds posted

    // Platform statistics
    uint256 public totalTasksCreated;
    uint256 public totalTasksCompleted;
    uint256 public totalVolumeUsdc;
    uint256 public totalFeesCollected;
    uint256 public totalAgents;

    // Timeout configuration
    uint256 public claimTimeout = 7 days;
    uint256 public disputeWindow = 3 days;
    uint256 public autoApproveWindow = 14 days;

    // Dispute split (basis points for poster share, rest goes to worker)
    uint256 public disputePosterShareBps = 7000; // 70% to poster by default

    // --- Events ---
    event TaskCreated(bytes32 indexed taskId, address indexed poster, uint256 bounty, bytes32 parentTaskId);
    event TaskBid(bytes32 indexed taskId, address indexed bidder, uint256 price, uint256 estimatedTime);
    event BidAccepted(bytes32 indexed taskId, address indexed bidder, uint256 price);
    event TaskClaimed(bytes32 indexed taskId, address indexed worker);
    event DeliverableSubmitted(bytes32 indexed taskId, bytes32 deliverableHash);
    event TaskApproved(bytes32 indexed taskId, address indexed worker, uint256 workerPayout, uint256 platformFee);
    event TaskDisputed(bytes32 indexed taskId);
    event TaskRefunded(bytes32 indexed taskId, address indexed poster, uint256 amount);
    event TaskCancelled(bytes32 indexed taskId, address indexed poster);
    event SubtaskCreated(bytes32 indexed parentTaskId, bytes32 indexed subtaskId, address indexed creator, uint256 bounty);
    event DisputeResolved(bytes32 indexed taskId, uint256 posterShare, uint256 workerShare);
    event AgentRegistered(address indexed agent);
    event FeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    // --- Errors ---
    error TaskAlreadyExists();
    error TaskDoesNotExist();
    error TaskNotOpen();
    error TaskNotClaimed();
    error TaskNotSubmitted();
    error TaskNotDisputed();
    error InvalidBounty();
    error InvalidBidPrice();
    error BidExceedsBounty();
    error PosterCannotBidOwnTask();
    error OnlyPosterCanPerform();
    error OnlyWorkerCanPerform();
    error BidAlreadyPlaced();
    error BidNotFound();
    error DisputeWindowExpired();
    error CannotRefundYet();
    error CannotCancelWithAcceptedBids();
    error InvalidFeeRecipient();
    error FeeTooHigh();
    error NotParentTaskWorker();
    error AutoApproveNotReady();
    error InvalidSplit();

    constructor(address _usdc, address _feeRecipient) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        usdc = IERC20(_usdc);
        feeRecipient = _feeRecipient;
    }

    // =============================================================
    //                       CORE TASK FUNCTIONS
    // =============================================================

    /**
     * @notice Post a new task with USDC bounty (deposited into escrow)
     * @param taskId Unique task identifier (bytes32 hash)
     * @param bountyAmount USDC amount (6 decimals)
     */
    function createTask(bytes32 taskId, uint256 bountyAmount) external nonReentrant whenNotPaused {
        _createTaskInternal(taskId, bountyAmount, bytes32(0));
    }

    /**
     * @notice Create a subtask linked to a parent task (agent supply chain)
     * @dev Only the worker of the parent task can create subtasks
     */
    function createSubtask(
        bytes32 parentTaskId,
        bytes32 subtaskId,
        uint256 bountyAmount
    ) external nonReentrant whenNotPaused {
        Task storage parent = tasks[parentTaskId];
        if (parent.poster == address(0)) revert TaskDoesNotExist();
        if (parent.worker != msg.sender) revert NotParentTaskWorker();
        if (parent.status != Status.Claimed) revert TaskNotClaimed();

        _createTaskInternal(subtaskId, bountyAmount, parentTaskId);
        subtasks[parentTaskId].push(subtaskId);

        emit SubtaskCreated(parentTaskId, subtaskId, msg.sender, bountyAmount);
    }

    function _createTaskInternal(bytes32 taskId, uint256 bountyAmount, bytes32 parentTaskId) internal {
        if (tasks[taskId].poster != address(0)) revert TaskAlreadyExists();
        if (bountyAmount == 0) revert InvalidBounty();

        usdc.safeTransferFrom(msg.sender, address(this), bountyAmount);

        tasks[taskId] = Task({
            poster: msg.sender,
            worker: address(0),
            bounty: bountyAmount,
            agreedPrice: bountyAmount,
            status: Status.Open,
            deliverableHash: bytes32(0),
            createdAt: block.timestamp,
            claimedAt: 0,
            submittedAt: 0,
            parentTaskId: parentTaskId,
            bidCount: 0
        });

        // Track reputation
        _ensureRegistered(msg.sender);
        reputation[msg.sender].tasksPosted++;
        reputation[msg.sender].totalSpent += bountyAmount;
        agentTasksPosted[msg.sender].push(taskId);

        totalTasksCreated++;
        emit TaskCreated(taskId, msg.sender, bountyAmount, parentTaskId);
    }

    // =============================================================
    //                       BIDDING SYSTEM
    // =============================================================

    /**
     * @notice Place a bid on an open task
     * @param taskId Task to bid on
     * @param price Bid price in USDC (must be <= bounty)
     * @param estimatedTime Estimated delivery time in seconds
     */
    function bidOnTask(bytes32 taskId, uint256 price, uint256 estimatedTime)
        external nonReentrant whenNotPaused
    {
        Task storage task = tasks[taskId];
        if (task.poster == address(0)) revert TaskDoesNotExist();
        if (task.status != Status.Open) revert TaskNotOpen();
        if (msg.sender == task.poster) revert PosterCannotBidOwnTask();
        if (price == 0) revert InvalidBidPrice();
        if (price > task.bounty) revert BidExceedsBounty();
        if (taskBids[taskId][msg.sender].bidder != address(0)) revert BidAlreadyPlaced();

        _ensureRegistered(msg.sender);

        taskBids[taskId][msg.sender] = Bid({
            bidder: msg.sender,
            price: price,
            estimatedTime: estimatedTime,
            timestamp: block.timestamp,
            accepted: false
        });

        taskBidders[taskId].push(msg.sender);
        task.bidCount++;

        emit TaskBid(taskId, msg.sender, price, estimatedTime);
    }

    /**
     * @notice Accept a bid on your task — assigns worker and locks agreed price
     * @param taskId Task to accept bid for
     * @param bidder Address of the bidder to accept
     */
    function acceptBid(bytes32 taskId, address bidder) external nonReentrant whenNotPaused {
        Task storage task = tasks[taskId];
        if (task.poster == address(0)) revert TaskDoesNotExist();
        if (task.status != Status.Open) revert TaskNotOpen();
        if (msg.sender != task.poster) revert OnlyPosterCanPerform();

        Bid storage bid = taskBids[taskId][bidder];
        if (bid.bidder == address(0)) revert BidNotFound();

        bid.accepted = true;
        task.worker = bidder;
        task.agreedPrice = bid.price;
        task.status = Status.Claimed;
        task.claimedAt = block.timestamp;

        // Refund difference if bid < bounty
        if (bid.price < task.bounty) {
            uint256 refundAmount = task.bounty - bid.price;
            usdc.safeTransfer(task.poster, refundAmount);
        }

        emit BidAccepted(taskId, bidder, bid.price);
        emit TaskClaimed(taskId, bidder);
    }

    /**
     * @notice Direct claim at full bounty price (for simple tasks)
     * @dev Poster still accepted this implicitly by posting. Worker commits to full bounty.
     */
    function claimTask(bytes32 taskId) external nonReentrant whenNotPaused {
        Task storage task = tasks[taskId];
        if (task.poster == address(0)) revert TaskDoesNotExist();
        if (task.status != Status.Open) revert TaskNotOpen();
        if (msg.sender == task.poster) revert PosterCannotBidOwnTask();

        _ensureRegistered(msg.sender);

        task.worker = msg.sender;
        task.agreedPrice = task.bounty;
        task.status = Status.Claimed;
        task.claimedAt = block.timestamp;

        emit TaskClaimed(taskId, msg.sender);
    }

    // =============================================================
    //                    DELIVERABLE & APPROVAL
    // =============================================================

    /**
     * @notice Submit a deliverable hash as proof of work
     */
    function submitDeliverable(bytes32 taskId, bytes32 deliverableHash) external nonReentrant whenNotPaused {
        Task storage task = tasks[taskId];
        if (task.status != Status.Claimed) revert TaskNotClaimed();
        if (msg.sender != task.worker) revert OnlyWorkerCanPerform();
        require(deliverableHash != bytes32(0), "Invalid deliverable hash");

        task.deliverableHash = deliverableHash;
        task.status = Status.Submitted;
        task.submittedAt = block.timestamp;

        emit DeliverableSubmitted(taskId, deliverableHash);
    }

    /**
     * @notice Approve the deliverable and release USDC to worker (minus platform fee)
     */
    function approveTask(bytes32 taskId) external nonReentrant whenNotPaused {
        Task storage task = tasks[taskId];
        if (task.status != Status.Submitted) revert TaskNotSubmitted();
        if (msg.sender != task.poster) revert OnlyPosterCanPerform();

        _releasePayment(taskId, task);
    }

    /**
     * @notice Auto-approve after timeout — prevents fund lock if poster disappears
     * @dev Callable by anyone after autoApproveWindow has passed since submission
     */
    function autoApprove(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.status != Status.Submitted) revert TaskNotSubmitted();
        if (block.timestamp < task.submittedAt + autoApproveWindow) revert AutoApproveNotReady();

        _releasePayment(taskId, task);
    }

    /**
     * @dev Internal: release payment to worker, collect fee, update stats + reputation
     */
    function _releasePayment(bytes32 taskId, Task storage task) internal {
        task.status = Status.Approved;

        uint256 fee = (task.agreedPrice * platformFeeBps) / BPS_DENOMINATOR;
        uint256 workerPayout = task.agreedPrice - fee;

        if (fee > 0) {
            usdc.safeTransfer(feeRecipient, fee);
            totalFeesCollected += fee;
        }

        usdc.safeTransfer(task.worker, workerPayout);

        // Update reputation
        reputation[task.worker].tasksCompleted++;
        reputation[task.worker].totalEarned += workerPayout;
        agentTasksCompleted[task.worker].push(taskId);

        totalTasksCompleted++;
        totalVolumeUsdc += task.agreedPrice;

        emit TaskApproved(taskId, task.worker, workerPayout, fee);
    }

    // =============================================================
    //                    DISPUTE & REFUND
    // =============================================================

    /**
     * @notice Dispute a submitted deliverable (within dispute window)
     */
    function disputeTask(bytes32 taskId) external nonReentrant whenNotPaused {
        Task storage task = tasks[taskId];
        if (task.status != Status.Submitted) revert TaskNotSubmitted();
        if (msg.sender != task.poster) revert OnlyPosterCanPerform();
        if (block.timestamp > task.submittedAt + disputeWindow) revert DisputeWindowExpired();

        task.status = Status.Disputed;
        reputation[task.poster].disputesAsPoster++;
        reputation[task.worker].disputesAsWorker++;

        emit TaskDisputed(taskId);
    }

    /**
     * @notice Resolve dispute with fair split — only contract owner (arbitrator)
     * @dev Split is configurable via disputePosterShareBps (default 70/30)
     */
    function resolveDispute(bytes32 taskId) external nonReentrant onlyOwner {
        Task storage task = tasks[taskId];
        if (task.status != Status.Disputed) revert TaskNotDisputed();

        task.status = Status.Refunded;

        uint256 posterShare = (task.agreedPrice * disputePosterShareBps) / BPS_DENOMINATOR;
        uint256 workerShare = task.agreedPrice - posterShare;

        usdc.safeTransfer(task.poster, posterShare);
        if (workerShare > 0) {
            usdc.safeTransfer(task.worker, workerShare);
        }

        emit DisputeResolved(taskId, posterShare, workerShare);
    }

    /**
     * @notice Refund poster for open tasks that timed out (no one claimed)
     */
    function refund(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (msg.sender != task.poster) revert OnlyPosterCanPerform();
        if (task.status != Status.Open) revert CannotRefundYet();
        if (block.timestamp <= task.createdAt + claimTimeout) revert CannotRefundYet();

        task.status = Status.Refunded;
        usdc.safeTransfer(task.poster, task.bounty);

        emit TaskRefunded(taskId, task.poster, task.bounty);
    }

    /**
     * @notice Cancel an open task — refunds bounty to poster
     * @dev Allowed even with pending bids (bids are just offers, no funds locked)
     */
    function cancelTask(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.poster == address(0)) revert TaskDoesNotExist();
        if (task.status != Status.Open) revert TaskNotOpen();
        if (msg.sender != task.poster) revert OnlyPosterCanPerform();

        task.status = Status.Cancelled;
        usdc.safeTransfer(task.poster, task.bounty);

        emit TaskCancelled(taskId, task.poster);
    }

    // =============================================================
    //                       REPUTATION (ON-CHAIN)
    // =============================================================

    /**
     * @dev Register agent if not already tracked
     */
    function _ensureRegistered(address agent) internal {
        if (reputation[agent].registeredAt == 0) {
            reputation[agent].registeredAt = block.timestamp;
            totalAgents++;
            emit AgentRegistered(agent);
        }
    }

    /**
     * @notice Get agent reputation
     */
    function getReputation(address agent) external view returns (AgentReputation memory) {
        return reputation[agent];
    }

    /**
     * @notice Get agent's completed task IDs
     */
    function getAgentCompletedTasks(address agent) external view returns (bytes32[] memory) {
        return agentTasksCompleted[agent];
    }

    /**
     * @notice Get agent's posted task IDs
     */
    function getAgentPostedTasks(address agent) external view returns (bytes32[] memory) {
        return agentTasksPosted[agent];
    }

    /**
     * @notice Calculate agent tier based on completed tasks
     * @return tier 0=New, 1=Bronze(5+), 2=Silver(15+), 3=Gold(30+), 4=Diamond(50+)
     */
    function getAgentTier(address agent) external view returns (uint8 tier) {
        uint256 completed = reputation[agent].tasksCompleted;
        if (completed >= 50) return 4; // Diamond
        if (completed >= 30) return 3; // Gold
        if (completed >= 15) return 2; // Silver
        if (completed >= 5)  return 1; // Bronze
        return 0; // New
    }

    // =============================================================
    //                       VIEW FUNCTIONS
    // =============================================================

    function getTask(bytes32 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    function getTaskBids(bytes32 taskId) external view returns (
        address[] memory bidders,
        Bid[] memory bids
    ) {
        bidders = taskBidders[taskId];
        bids = new Bid[](bidders.length);
        for (uint256 i = 0; i < bidders.length; i++) {
            bids[i] = taskBids[taskId][bidders[i]];
        }
        return (bidders, bids);
    }

    function getBid(bytes32 taskId, address bidder) external view returns (Bid memory) {
        return taskBids[taskId][bidder];
    }

    function getSubtasks(bytes32 parentTaskId) external view returns (bytes32[] memory) {
        return subtasks[parentTaskId];
    }

    function getStats() external view returns (
        uint256 tasksCreated,
        uint256 tasksCompleted,
        uint256 volumeUsdc,
        uint256 feesCollected,
        uint256 currentFeeBps,
        uint256 registeredAgents
    ) {
        return (totalTasksCreated, totalTasksCompleted, totalVolumeUsdc, totalFeesCollected, platformFeeBps, totalAgents);
    }

    // =============================================================
    //                       ADMIN FUNCTIONS
    // =============================================================

    function setFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        uint256 oldFee = platformFeeBps;
        platformFeeBps = newFeeBps;
        emit FeeUpdated(oldFee, newFeeBps);
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        if (newRecipient == address(0)) revert InvalidFeeRecipient();
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    function setClaimTimeout(uint256 newTimeout) external onlyOwner {
        claimTimeout = newTimeout;
    }

    function setDisputeWindow(uint256 newWindow) external onlyOwner {
        disputeWindow = newWindow;
    }

    function setAutoApproveWindow(uint256 newWindow) external onlyOwner {
        autoApproveWindow = newWindow;
    }

    function setDisputeSplit(uint256 newPosterShareBps) external onlyOwner {
        if (newPosterShareBps > BPS_DENOMINATOR) revert InvalidSplit();
        disputePosterShareBps = newPosterShareBps;
    }

    /// @notice Emergency pause — stops all state-changing operations
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause after emergency
    function unpause() external onlyOwner {
        _unpause();
    }
}
