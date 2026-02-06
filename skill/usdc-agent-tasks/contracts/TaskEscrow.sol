// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TaskEscrow
 * @notice Escrow contract for the Agent Economy Protocol — USDC-based task marketplace
 * @dev Agents post tasks with USDC bounties, workers bid on tasks, posters accept bids,
 *      workers deliver, poster approves to release funds minus platform fee.
 *      Supports agent-to-agent subcontracting (supply chains).
 *
 * Key Features:
 * - 2.5% platform fee on task completion
 * - Competitive bidding system
 * - Agent-to-agent subtask creation
 * - Dispute resolution with refund mechanism
 * - Timeout-based refunds
 */
contract TaskEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    // Platform fee configuration (basis points, 250 = 2.5%)
    uint256 public platformFeeBps = 250;
    uint256 public constant MAX_FEE_BPS = 1000; // Max 10%
    uint256 public constant BPS_DENOMINATOR = 10000;
    address public feeRecipient;

    // Task status lifecycle
    enum Status {
        Open,       // Task posted, accepting bids
        Claimed,    // Bid accepted, worker assigned
        Submitted,  // Worker submitted deliverable
        Approved,   // Poster approved, payment released
        Disputed,   // Poster disputed submission
        Refunded,   // Funds returned to poster
        Cancelled   // Task cancelled before claim
    }

    struct Task {
        address poster;
        address worker;
        uint256 bounty;          // Original posted bounty
        uint256 agreedPrice;     // Accepted bid price (may differ from bounty)
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
        uint256 price;           // Bid amount in USDC
        uint256 estimatedTime;   // Estimated delivery time in seconds
        uint256 timestamp;
        bool accepted;
    }

    // Storage
    mapping(bytes32 => Task) public tasks;
    mapping(bytes32 => mapping(address => Bid)) public taskBids;      // taskId => bidder => Bid
    mapping(bytes32 => address[]) public taskBidders;                  // taskId => list of bidders
    mapping(bytes32 => bytes32[]) public subtasks;                     // parentTaskId => childTaskIds

    // Platform statistics
    uint256 public totalTasksCreated;
    uint256 public totalTasksCompleted;
    uint256 public totalVolumeUsdc;
    uint256 public totalFeesCollected;

    // Timeout configuration
    uint256 public claimTimeout = 7 days;
    uint256 public disputeWindow = 3 days;

    // --- Events ---
    event TaskCreated(
        bytes32 indexed taskId,
        address indexed poster,
        uint256 bounty,
        bytes32 parentTaskId
    );

    event TaskBid(
        bytes32 indexed taskId,
        address indexed bidder,
        uint256 price,
        uint256 estimatedTime
    );

    event BidAccepted(
        bytes32 indexed taskId,
        address indexed bidder,
        uint256 price
    );

    event TaskClaimed(
        bytes32 indexed taskId,
        address indexed worker
    );

    event DeliverableSubmitted(
        bytes32 indexed taskId,
        bytes32 deliverableHash
    );

    event TaskApproved(
        bytes32 indexed taskId,
        address indexed worker,
        uint256 workerPayout,
        uint256 platformFee
    );

    event TaskDisputed(bytes32 indexed taskId);

    event TaskRefunded(
        bytes32 indexed taskId,
        address indexed poster,
        uint256 amount
    );

    event TaskCancelled(
        bytes32 indexed taskId,
        address indexed poster
    );

    event SubtaskCreated(
        bytes32 indexed parentTaskId,
        bytes32 indexed subtaskId,
        address indexed creator,
        uint256 bounty
    );

    event FeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    // --- Errors ---
    error TaskAlreadyExists();
    error TaskDoesNotExist();
    error TaskNotOpen();
    error TaskNotClaimed();
    error TaskNotSubmitted();
    error InvalidBounty();
    error InvalidBidPrice();
    error PosterCannotClaimOwnTask();
    error OnlyPosterCanPerform();
    error OnlyWorkerCanPerform();
    error BidAlreadyPlaced();
    error NoBidsOnTask();
    error BidNotFound();
    error DisputeWindowExpired();
    error CannotRefundAtThisTime();
    error InvalidFeeRecipient();
    error FeeTooHigh();
    error InsufficientBalance();
    error NotParentTaskWorker();
    error BidExceedsBounty();
    error AutoApproveNotReady();
    error TaskNotSubmittedOrClaimed();

    // Auto-approval: if poster doesn't act within this window after submission, worker can self-release
    uint256 public autoApproveWindow = 14 days;

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
     * @param taskId Unique task identifier (bytes32 hash of task ID string)
     * @param bountyAmount USDC amount (in smallest unit, 6 decimals)
     */
    function createTask(bytes32 taskId, uint256 bountyAmount) external nonReentrant {
        _createTaskInternal(taskId, bountyAmount, bytes32(0));
    }

    /**
     * @notice Create a subtask linked to a parent task (agent-to-agent subcontracting)
     * @dev Only the worker of the parent task can create subtasks
     * @param parentTaskId The parent task this subtask belongs to
     * @param subtaskId Unique identifier for the subtask
     * @param bountyAmount USDC bounty for the subtask
     */
    function createSubtask(
        bytes32 parentTaskId,
        bytes32 subtaskId,
        uint256 bountyAmount
    ) external nonReentrant {
        Task storage parent = tasks[parentTaskId];
        if (parent.poster == address(0)) revert TaskDoesNotExist();
        if (parent.worker != msg.sender) revert NotParentTaskWorker();
        if (parent.status != Status.Claimed) revert TaskNotClaimed();

        _createTaskInternal(subtaskId, bountyAmount, parentTaskId);
        subtasks[parentTaskId].push(subtaskId);

        emit SubtaskCreated(parentTaskId, subtaskId, msg.sender, bountyAmount);
    }

    /**
     * @dev Internal function to create a task
     */
    function _createTaskInternal(
        bytes32 taskId,
        uint256 bountyAmount,
        bytes32 parentTaskId
    ) internal {
        if (tasks[taskId].poster != address(0)) revert TaskAlreadyExists();
        if (bountyAmount == 0) revert InvalidBounty();

        // Transfer USDC from poster to this contract
        usdc.safeTransferFrom(msg.sender, address(this), bountyAmount);

        tasks[taskId] = Task({
            poster: msg.sender,
            worker: address(0),
            bounty: bountyAmount,
            agreedPrice: bountyAmount, // Default to bounty, updated when bid accepted
            status: Status.Open,
            deliverableHash: bytes32(0),
            createdAt: block.timestamp,
            claimedAt: 0,
            submittedAt: 0,
            parentTaskId: parentTaskId,
            bidCount: 0
        });

        totalTasksCreated++;

        emit TaskCreated(taskId, msg.sender, bountyAmount, parentTaskId);
    }

    // =============================================================
    //                       BIDDING SYSTEM
    // =============================================================

    /**
     * @notice Place a bid on an open task
     * @param taskId Task to bid on
     * @param price Bid price in USDC (can be different from posted bounty)
     * @param estimatedTime Estimated delivery time in seconds
     */
    function bidOnTask(
        bytes32 taskId,
        uint256 price,
        uint256 estimatedTime
    ) external {
        Task storage task = tasks[taskId];
        if (task.poster == address(0)) revert TaskDoesNotExist();
        if (task.status != Status.Open) revert TaskNotOpen();
        if (msg.sender == task.poster) revert PosterCannotClaimOwnTask();
        if (price == 0) revert InvalidBidPrice();
        if (price > task.bounty) revert BidExceedsBounty(); // Bids must be <= bounty (poster deposited bounty)
        if (taskBids[taskId][msg.sender].bidder != address(0)) revert BidAlreadyPlaced();

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
     * @notice Accept a bid on your task
     * @param taskId Task to accept bid for
     * @param bidder Address of the bidder to accept
     */
    function acceptBid(bytes32 taskId, address bidder) external nonReentrant {
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

        // If bid price is less than bounty, refund the difference to poster
        if (bid.price < task.bounty) {
            uint256 refundAmount = task.bounty - bid.price;
            usdc.safeTransfer(task.poster, refundAmount);
        }

        emit BidAccepted(taskId, bidder, bid.price);
        emit TaskClaimed(taskId, bidder);
    }

    /**
     * @notice Direct claim (legacy support) - claims at full bounty price
     * @param taskId Task to claim
     */
    function claimTask(bytes32 taskId) external {
        Task storage task = tasks[taskId];
        if (task.poster == address(0)) revert TaskDoesNotExist();
        if (task.status != Status.Open) revert TaskNotOpen();
        if (msg.sender == task.poster) revert PosterCannotClaimOwnTask();

        task.worker = msg.sender;
        task.agreedPrice = task.bounty; // Full bounty
        task.status = Status.Claimed;
        task.claimedAt = block.timestamp;

        emit TaskClaimed(taskId, msg.sender);
    }

    // =============================================================
    //                    DELIVERABLE & APPROVAL
    // =============================================================

    /**
     * @notice Submit a deliverable hash as proof of work
     * @param taskId Task to submit for
     * @param deliverableHash Hash of the deliverable (e.g., IPFS CID hash)
     */
    function submitDeliverable(bytes32 taskId, bytes32 deliverableHash) external {
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
     * @param taskId Task to approve
     */
    function approveTask(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.status != Status.Submitted) revert TaskNotSubmitted();
        if (msg.sender != task.poster) revert OnlyPosterCanPerform();

        task.status = Status.Approved;

        // Calculate platform fee and worker payout
        uint256 fee = (task.agreedPrice * platformFeeBps) / BPS_DENOMINATOR;
        uint256 workerPayout = task.agreedPrice - fee;

        // Transfer fee to platform
        if (fee > 0) {
            usdc.safeTransfer(feeRecipient, fee);
            totalFeesCollected += fee;
        }

        // Release remaining USDC to worker
        usdc.safeTransfer(task.worker, workerPayout);

        totalTasksCompleted++;
        totalVolumeUsdc += task.agreedPrice;

        emit TaskApproved(taskId, task.worker, workerPayout, fee);
    }

    /**
     * @notice Auto-approve: if poster doesn't act within autoApproveWindow after submission, worker can release payment
     * @dev Prevents funds from being locked forever if poster disappears
     * @param taskId Task to auto-approve
     */
    function autoApprove(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.status != Status.Submitted) revert TaskNotSubmitted();
        if (block.timestamp < task.submittedAt + autoApproveWindow) revert AutoApproveNotReady();

        task.status = Status.Approved;

        uint256 fee = (task.agreedPrice * platformFeeBps) / BPS_DENOMINATOR;
        uint256 workerPayout = task.agreedPrice - fee;

        if (fee > 0) {
            usdc.safeTransfer(feeRecipient, fee);
            totalFeesCollected += fee;
        }

        usdc.safeTransfer(task.worker, workerPayout);

        totalTasksCompleted++;
        totalVolumeUsdc += task.agreedPrice;

        emit TaskApproved(taskId, task.worker, workerPayout, fee);
    }

    // =============================================================
    //                    DISPUTE & REFUND
    // =============================================================

    /**
     * @notice Dispute a submitted deliverable (within dispute window)
     * @param taskId Task to dispute
     */
    function disputeTask(bytes32 taskId) external {
        Task storage task = tasks[taskId];
        if (task.status != Status.Submitted) revert TaskNotSubmitted();
        if (msg.sender != task.poster) revert OnlyPosterCanPerform();
        if (block.timestamp > task.submittedAt + disputeWindow) revert DisputeWindowExpired();

        task.status = Status.Disputed;
        emit TaskDisputed(taskId);
    }

    /**
     * @notice Refund the poster (if no claim after timeout)
     * @param taskId Task to refund
     */
    function refund(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (msg.sender != task.poster) revert OnlyPosterCanPerform();

        // Only allow full refund for open tasks that timed out
        if (task.status != Status.Open) revert CannotRefundAtThisTime();
        if (block.timestamp <= task.createdAt + claimTimeout) revert CannotRefundAtThisTime();

        task.status = Status.Refunded;
        usdc.safeTransfer(task.poster, task.bounty);

        emit TaskRefunded(taskId, task.poster, task.bounty);
    }

    /**
     * @notice Resolve a dispute with a fair split (poster gets 70%, worker gets 30%)
     * @dev Only callable by contract owner as neutral arbitrator
     * @param taskId Task to resolve
     */
    function resolveDispute(bytes32 taskId) external nonReentrant onlyOwner {
        Task storage task = tasks[taskId];
        if (task.status != Status.Disputed) revert CannotRefundAtThisTime();

        task.status = Status.Refunded;

        // Fair split: 70% to poster, 30% to worker (worker did some work)
        uint256 posterShare = (task.agreedPrice * 7000) / BPS_DENOMINATOR;
        uint256 workerShare = task.agreedPrice - posterShare;

        usdc.safeTransfer(task.poster, posterShare);
        if (workerShare > 0) {
            usdc.safeTransfer(task.worker, workerShare);
        }

        emit TaskRefunded(taskId, task.poster, posterShare);
    }

    /**
     * @notice Cancel an open task before any claim/bid accepted
     * @param taskId Task to cancel
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
    //                       VIEW FUNCTIONS
    // =============================================================

    /**
     * @notice Get task details
     * @param taskId Task to query
     */
    function getTask(bytes32 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    /**
     * @notice Get all bids for a task
     * @param taskId Task to get bids for
     * @return bidders Array of bidder addresses
     * @return bids Array of Bid structs
     */
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

    /**
     * @notice Get a specific bid on a task
     * @param taskId Task ID
     * @param bidder Bidder address
     */
    function getBid(bytes32 taskId, address bidder) external view returns (Bid memory) {
        return taskBids[taskId][bidder];
    }

    /**
     * @notice Get subtasks of a parent task
     * @param parentTaskId Parent task ID
     */
    function getSubtasks(bytes32 parentTaskId) external view returns (bytes32[] memory) {
        return subtasks[parentTaskId];
    }

    /**
     * @notice Get platform statistics
     */
    function getStats() external view returns (
        uint256 tasksCreated,
        uint256 tasksCompleted,
        uint256 volumeUsdc,
        uint256 feesCollected,
        uint256 currentFeeBps
    ) {
        return (
            totalTasksCreated,
            totalTasksCompleted,
            totalVolumeUsdc,
            totalFeesCollected,
            platformFeeBps
        );
    }

    // =============================================================
    //                       ADMIN FUNCTIONS
    // =============================================================

    /**
     * @notice Update platform fee (owner only)
     * @param newFeeBps New fee in basis points (e.g., 250 = 2.5%)
     */
    function setFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        uint256 oldFee = platformFeeBps;
        platformFeeBps = newFeeBps;
        emit FeeUpdated(oldFee, newFeeBps);
    }

    /**
     * @notice Update fee recipient address (owner only)
     * @param newRecipient New fee recipient address
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        if (newRecipient == address(0)) revert InvalidFeeRecipient();
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    /**
     * @notice Update claim timeout (owner only)
     * @param newTimeout New timeout in seconds
     */
    function setClaimTimeout(uint256 newTimeout) external onlyOwner {
        claimTimeout = newTimeout;
    }

    /**
     * @notice Update dispute window (owner only)
     * @param newWindow New window in seconds
     */
    function setDisputeWindow(uint256 newWindow) external onlyOwner {
        disputeWindow = newWindow;
    }

    /**
     * @notice Update auto-approve window (owner only)
     * @param newWindow New window in seconds
     */
    function setAutoApproveWindow(uint256 newWindow) external onlyOwner {
        autoApproveWindow = newWindow;
    }
}
