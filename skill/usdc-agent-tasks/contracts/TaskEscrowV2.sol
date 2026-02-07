// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IHireToken
 * @notice Interface for the HireToken contract used by TaskEscrowV2
 */
interface IHireToken {
    function mintForWork(address worker, address poster, uint256 taskValueUSDC) external;
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function burn(uint256 amount) external;
}

/**
 * @title TaskEscrowV2
 * @notice Escrow contract for the Agent Economy Protocol — USDC-based task marketplace
 * @dev V2 adds: Flash Tasks, Stake-to-Work ($HIRE staking for bidders),
 *      Work Mining integration, and stake slashing on disputes.
 *
 * Security Features:
 * - Pausable: Emergency shutdown capability
 * - ReentrancyGuard: On ALL state-changing functions
 * - SafeERC20: For all token transfers
 * - Bid cap: Bids cannot exceed bounty (prevents fund drain)
 * - Auto-approve: Worker can self-release after timeout (prevents fund lock)
 * - Fair dispute: Owner arbitration with configurable split
 * - On-chain reputation tracking
 * - Stake-to-Work: Bidders must stake $HIRE proportional to task value
 * - Flash Tasks: Instant resolution via hash matching
 *
 * Work Mining:
 * - Standard task completion triggers $HIRE minting for worker + poster
 * - Flash task completion also triggers mining
 */
contract TaskEscrowV2 is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IHireToken public hireToken;

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

    // Task type: Standard (bid/accept flow) or Flash (instant hash match)
    enum TaskType {
        Standard,
        Flash
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
        TaskType taskType;       // Standard or Flash
        bytes32 expectedResultHash; // For Flash tasks: the expected answer hash
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

    // Stake-to-Work: $HIRE stake requirements per task value tier
    // These thresholds are in USDC (6 decimals)
    uint256 public constant TIER1_MAX = 50e6;      // <= 50 USDC
    uint256 public constant TIER2_MAX = 500e6;     // <= 500 USDC
    uint256 public constant TIER3_MAX = 5000e6;    // <= 5000 USDC
    // > 5000 USDC = tier 4

    // Stake amounts in HIRE (18 decimals)
    uint256 public constant STAKE_TIER1 = 500e18;       // 500 HIRE
    uint256 public constant STAKE_TIER2 = 5_000e18;     // 5,000 HIRE
    uint256 public constant STAKE_TIER3 = 25_000e18;    // 25,000 HIRE
    uint256 public constant STAKE_TIER4 = 50_000e18;    // 50,000 HIRE

    // Slash configuration for disputes (basis points)
    uint256 public slashPosterBps = 6000;   // 60% of slash → poster
    uint256 public slashResolverBps = 2000; // 20% of slash → resolver
    uint256 public slashBurnBps = 2000;     // 20% of slash → burn
    uint256 public slashPercentBps = 5000;  // 50% of stake gets slashed

    // Orchestrator fee for subtasks (basis points, 1000 = 10%)
    uint256 public orchestratorFeeBps = 1000;

    // Storage
    mapping(bytes32 => Task) public tasks;
    mapping(bytes32 => mapping(address => Bid)) public taskBids;
    mapping(bytes32 => address[]) public taskBidders;
    mapping(bytes32 => bytes32[]) public subtasks;
    mapping(address => AgentReputation) public reputation;
    mapping(address => bytes32[]) public agentTasksCompleted;
    mapping(address => bytes32[]) public agentTasksPosted;

    // Stake-to-Work: track staked HIRE per bidder per task
    mapping(bytes32 => mapping(address => uint256)) public bidStakes;

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
    event FlashTaskCreated(bytes32 indexed taskId, address indexed poster, uint256 bounty, bytes32 expectedResultHash);
    event FlashTaskCompleted(bytes32 indexed taskId, address indexed worker, uint256 amount);
    event StakeSlashed(address indexed agent, uint256 amount, bytes32 indexed taskId);

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
    error InsufficientStake();
    error NotFlashTask();
    error InvalidResultHash();
    error HireTokenNotSet();

    constructor(address _usdc, address _feeRecipient) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        usdc = IERC20(_usdc);
        feeRecipient = _feeRecipient;
    }

    // =============================================================
    //                       CONFIGURATION
    // =============================================================

    /**
     * @notice Set the HireToken contract address for staking and mining
     * @param _hireToken Address of the HireToken contract
     */
    function setHireToken(address _hireToken) external onlyOwner {
        require(_hireToken != address(0), "Invalid address");
        hireToken = IHireToken(_hireToken);
    }

    // =============================================================
    //                       STAKE REQUIREMENTS
    // =============================================================

    /**
     * @notice Get the required $HIRE stake for a given task value
     * @param taskValue Task value in USDC (6 decimals)
     * @return Required stake in HIRE (18 decimals)
     */
    function getRequiredStake(uint256 taskValue) public pure returns (uint256) {
        if (taskValue <= TIER1_MAX) return STAKE_TIER1;
        if (taskValue <= TIER2_MAX) return STAKE_TIER2;
        if (taskValue <= TIER3_MAX) return STAKE_TIER3;
        return STAKE_TIER4;
    }

    // =============================================================
    //                       CORE TASK FUNCTIONS
    // =============================================================

    /**
     * @notice Post a new standard task with USDC bounty (deposited into escrow)
     * @param taskId Unique task identifier (bytes32 hash)
     * @param bountyAmount USDC amount (6 decimals)
     */
    function createTask(bytes32 taskId, uint256 bountyAmount) external nonReentrant whenNotPaused {
        _createTaskInternal(taskId, bountyAmount, bytes32(0), TaskType.Standard, bytes32(0));
    }

    /**
     * @notice Create a subtask linked to a parent task (agent supply chain)
     * @dev Only the worker of the parent task can create subtasks.
     *      Max 2 levels: parent → children (no grandchildren).
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

        // Prevent grandchildren: if parent has a parentTaskId, this would be 3rd level
        require(parent.parentTaskId == bytes32(0), "Max 2 levels: no grandchildren");

        _createTaskInternal(subtaskId, bountyAmount, parentTaskId, TaskType.Standard, bytes32(0));
        subtasks[parentTaskId].push(subtaskId);

        emit SubtaskCreated(parentTaskId, subtaskId, msg.sender, bountyAmount);
    }

    function _createTaskInternal(
        bytes32 taskId,
        uint256 bountyAmount,
        bytes32 parentTaskId,
        TaskType taskType,
        bytes32 expectedResultHash
    ) internal {
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
            bidCount: 0,
            taskType: taskType,
            expectedResultHash: expectedResultHash
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
    //                       FLASH TASKS
    // =============================================================

    /**
     * @notice Create a Flash Task with expected result hash for instant resolution
     * @dev Flash tasks skip the bid/accept flow. First correct answer wins.
     * @param taskId Unique task identifier
     * @param bountyAmount USDC bounty amount
     * @param expectedResultHash Keccak256 hash of the expected result
     */
    function createFlashTask(
        bytes32 taskId,
        uint256 bountyAmount,
        bytes32 expectedResultHash
    ) external nonReentrant whenNotPaused {
        require(expectedResultHash != bytes32(0), "Invalid result hash");
        _createTaskInternal(taskId, bountyAmount, bytes32(0), TaskType.Flash, expectedResultHash);
        emit FlashTaskCreated(taskId, msg.sender, bountyAmount, expectedResultHash);
    }

    /**
     * @notice Complete a Flash Task by submitting the correct result hash
     * @dev If hash matches, instant payout to submitter. If no match, reverts.
     * @param taskId The flash task to complete
     * @param resultHash The result hash to verify
     */
    function completeFlashTask(
        bytes32 taskId,
        bytes32 resultHash
    ) external nonReentrant whenNotPaused {
        Task storage task = tasks[taskId];
        if (task.poster == address(0)) revert TaskDoesNotExist();
        if (task.status != Status.Open) revert TaskNotOpen();
        if (task.taskType != TaskType.Flash) revert NotFlashTask();
        if (resultHash != task.expectedResultHash) revert InvalidResultHash();

        _ensureRegistered(msg.sender);

        task.worker = msg.sender;
        task.agreedPrice = task.bounty;
        task.status = Status.Approved;
        task.deliverableHash = resultHash;

        uint256 fee = (task.bounty * platformFeeBps) / BPS_DENOMINATOR;
        uint256 workerPayout = task.bounty - fee;

        if (fee > 0) {
            usdc.safeTransfer(feeRecipient, fee);
            totalFeesCollected += fee;
        }

        usdc.safeTransfer(msg.sender, workerPayout);

        // Update reputation
        reputation[msg.sender].tasksCompleted++;
        reputation[msg.sender].totalEarned += workerPayout;
        agentTasksCompleted[msg.sender].push(taskId);

        totalTasksCompleted++;
        totalVolumeUsdc += task.bounty;

        // Work Mining: mint $HIRE for flash task completion
        _mintWorkRewards(msg.sender, task.poster, task.bounty);

        emit FlashTaskCompleted(taskId, msg.sender, workerPayout);
        emit TaskApproved(taskId, msg.sender, workerPayout, fee);
    }

    // =============================================================
    //                       BIDDING SYSTEM
    // =============================================================

    /**
     * @notice Place a bid on an open task. Requires $HIRE stake if hireToken is set.
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

        // Stake-to-Work: require $HIRE stake if token is configured
        if (address(hireToken) != address(0)) {
            uint256 requiredStake = getRequiredStake(task.bounty);
            bool success = hireToken.transferFrom(msg.sender, address(this), requiredStake);
            if (!success) revert InsufficientStake();
            bidStakes[taskId][msg.sender] = requiredStake;
        }

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
     * @notice Accept a bid on your task — assigns worker and locks agreed price.
     *         Returns $HIRE stakes to rejected bidders.
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

        // Return stakes to all rejected bidders
        if (address(hireToken) != address(0)) {
            address[] memory bidders = taskBidders[taskId];
            for (uint256 i = 0; i < bidders.length; i++) {
                if (bidders[i] != bidder) {
                    _returnStake(bidders[i], taskId);
                }
            }
        }

        emit BidAccepted(taskId, bidder, bid.price);
        emit TaskClaimed(taskId, bidder);
    }

    /**
     * @notice Direct claim at full bounty price (for simple tasks)
     * @dev Requires $HIRE stake if token is configured.
     */
    function claimTask(bytes32 taskId) external nonReentrant whenNotPaused {
        Task storage task = tasks[taskId];
        if (task.poster == address(0)) revert TaskDoesNotExist();
        if (task.status != Status.Open) revert TaskNotOpen();
        if (msg.sender == task.poster) revert PosterCannotBidOwnTask();

        _ensureRegistered(msg.sender);

        // Stake-to-Work: require $HIRE stake if token is configured
        if (address(hireToken) != address(0)) {
            uint256 requiredStake = getRequiredStake(task.bounty);
            bool success = hireToken.transferFrom(msg.sender, address(this), requiredStake);
            if (!success) revert InsufficientStake();
            bidStakes[taskId][msg.sender] = requiredStake;
        }

        task.worker = msg.sender;
        task.agreedPrice = task.bounty;
        task.status = Status.Claimed;
        task.claimedAt = block.timestamp;

        emit TaskClaimed(taskId, msg.sender);
    }

    /**
     * @dev Return $HIRE stake to a bidder
     */
    function _returnStake(address bidder, bytes32 taskId) internal {
        uint256 stakeAmount = bidStakes[taskId][bidder];
        if (stakeAmount > 0) {
            bidStakes[taskId][bidder] = 0;
            hireToken.transfer(bidder, stakeAmount);
        }
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
     * @notice Approve the deliverable and release USDC to worker (minus platform fee).
     *         Returns $HIRE stake and triggers Work Mining.
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
     * @dev Internal: release payment to worker, collect fee, update stats,
     *      return stake, and trigger work mining.
     *      Also handles orchestrator fees for subtasks.
     */
    function _releasePayment(bytes32 taskId, Task storage task) internal {
        task.status = Status.Approved;

        uint256 payableAmount = task.agreedPrice;
        uint256 orchestratorFee = 0;

        // If this is a subtask, deduct orchestrator fee for the parent task worker
        if (task.parentTaskId != bytes32(0)) {
            Task storage parent = tasks[task.parentTaskId];
            orchestratorFee = (payableAmount * orchestratorFeeBps) / BPS_DENOMINATOR;
            if (orchestratorFee > 0 && parent.worker != address(0)) {
                usdc.safeTransfer(parent.worker, orchestratorFee);
                payableAmount -= orchestratorFee;
            }
        }

        uint256 fee = (payableAmount * platformFeeBps) / BPS_DENOMINATOR;
        uint256 workerPayout = payableAmount - fee;

        if (fee > 0) {
            usdc.safeTransfer(feeRecipient, fee);
            totalFeesCollected += fee;
        }

        usdc.safeTransfer(task.worker, workerPayout);

        // Return $HIRE stake to worker
        if (address(hireToken) != address(0)) {
            _returnStake(task.worker, taskId);
        }

        // Update reputation
        reputation[task.worker].tasksCompleted++;
        reputation[task.worker].totalEarned += workerPayout;
        agentTasksCompleted[task.worker].push(taskId);

        totalTasksCompleted++;
        totalVolumeUsdc += task.agreedPrice;

        // Work Mining: mint $HIRE for completed work
        _mintWorkRewards(task.worker, task.poster, task.agreedPrice);

        // Check if all sibling subtasks are done → auto-complete parent
        if (task.parentTaskId != bytes32(0)) {
            _checkParentCompletion(task.parentTaskId);
        }

        emit TaskApproved(taskId, task.worker, workerPayout, fee);
    }

    /**
     * @dev Mint work mining rewards if HireToken is configured
     */
    function _mintWorkRewards(address worker, address poster, uint256 taskValueUSDC) internal {
        if (address(hireToken) != address(0)) {
            try hireToken.mintForWork(worker, poster, taskValueUSDC) {} catch {}
        }
    }

    // =============================================================
    //                    TASK FORKS (PARENT/CHILD)
    // =============================================================

    /**
     * @notice Get subtask status summary for a parent task
     * @param parentId The parent task ID
     * @return total Total number of subtasks
     * @return completed Number of completed (approved) subtasks
     * @return failed Number of failed (refunded/cancelled) subtasks
     * @return pending Number of pending (not yet resolved) subtasks
     */
    function getSubtaskStatus(bytes32 parentId) external view returns (
        uint256 total,
        uint256 completed,
        uint256 failed,
        uint256 pending
    ) {
        bytes32[] memory children = subtasks[parentId];
        total = children.length;
        for (uint256 i = 0; i < children.length; i++) {
            Status s = tasks[children[i]].status;
            if (s == Status.Approved) {
                completed++;
            } else if (s == Status.Refunded || s == Status.Cancelled) {
                failed++;
            } else {
                pending++;
            }
        }
    }

    /**
     * @notice Cancel a subtask — only the parent task worker (orchestrator) can cancel
     * @param taskId The subtask to cancel
     */
    function cancelSubtask(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.poster == address(0)) revert TaskDoesNotExist();
        require(task.parentTaskId != bytes32(0), "Not a subtask");
        if (task.status != Status.Open) revert TaskNotOpen();

        // Only the parent task's worker (who is also the subtask poster) can cancel
        Task storage parent = tasks[task.parentTaskId];
        require(msg.sender == parent.worker, "Only orchestrator can cancel subtask");

        task.status = Status.Cancelled;
        usdc.safeTransfer(task.poster, task.bounty);

        emit TaskCancelled(taskId, task.poster);
    }

    /**
     * @dev Check if all subtasks of a parent are completed, and auto-complete the parent
     */
    function _checkParentCompletion(bytes32 parentId) internal {
        bytes32[] memory children = subtasks[parentId];
        if (children.length == 0) return;

        for (uint256 i = 0; i < children.length; i++) {
            Status s = tasks[children[i]].status;
            if (s != Status.Approved && s != Status.Refunded && s != Status.Cancelled) {
                return; // Still pending children
            }
        }

        // All children resolved — auto-complete parent if it's still Claimed
        Task storage parent = tasks[parentId];
        if (parent.status == Status.Claimed) {
            parent.status = Status.Approved;

            // Update parent reputation
            reputation[parent.worker].tasksCompleted++;
            agentTasksCompleted[parent.worker].push(parentId);
            totalTasksCompleted++;

            emit TaskApproved(parentId, parent.worker, 0, 0);
        }
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
     * @notice Resolve dispute — USDC split + $HIRE stake slashing
     * @dev Only contract owner (arbitrator). If worker loses, their $HIRE stake is slashed:
     *      60% to poster, 20% to resolver (owner), 20% burned.
     *      USDC is split per disputePosterShareBps.
     */
    function resolveDispute(bytes32 taskId) external nonReentrant onlyOwner {
        Task storage task = tasks[taskId];
        if (task.status != Status.Disputed) revert TaskNotDisputed();

        task.status = Status.Refunded;

        // USDC split
        uint256 posterShare = (task.agreedPrice * disputePosterShareBps) / BPS_DENOMINATOR;
        uint256 workerShare = task.agreedPrice - posterShare;

        usdc.safeTransfer(task.poster, posterShare);
        if (workerShare > 0) {
            usdc.safeTransfer(task.worker, workerShare);
        }

        // Slash $HIRE stake if token is configured
        if (address(hireToken) != address(0)) {
            uint256 stakeAmount = bidStakes[taskId][task.worker];
            if (stakeAmount > 0) {
                bidStakes[taskId][task.worker] = 0;
                uint256 slashAmount = (stakeAmount * slashPercentBps) / BPS_DENOMINATOR;
                uint256 remainingStake = stakeAmount - slashAmount;

                // Return unslashed portion to worker
                if (remainingStake > 0) {
                    hireToken.transfer(task.worker, remainingStake);
                }

                // Distribute slashed amount: 60% poster, 20% resolver, 20% burn
                uint256 toPoster = (slashAmount * slashPosterBps) / BPS_DENOMINATOR;
                uint256 toResolver = (slashAmount * slashResolverBps) / BPS_DENOMINATOR;
                uint256 toBurn = slashAmount - toPoster - toResolver;

                if (toPoster > 0) hireToken.transfer(task.poster, toPoster);
                if (toResolver > 0) hireToken.transfer(msg.sender, toResolver);
                if (toBurn > 0) hireToken.burn(toBurn);

                emit StakeSlashed(task.worker, slashAmount, taskId);
            }
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
     * @notice Cancel an open task — refunds bounty to poster.
     *         Returns stakes to all bidders.
     */
    function cancelTask(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        if (task.poster == address(0)) revert TaskDoesNotExist();
        if (task.status != Status.Open) revert TaskNotOpen();
        if (msg.sender != task.poster) revert OnlyPosterCanPerform();

        task.status = Status.Cancelled;
        usdc.safeTransfer(task.poster, task.bounty);

        // Return all bidder stakes
        if (address(hireToken) != address(0)) {
            address[] memory bidders = taskBidders[taskId];
            for (uint256 i = 0; i < bidders.length; i++) {
                _returnStake(bidders[i], taskId);
            }
        }

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
        if (completed >= 50) return 4;
        if (completed >= 30) return 3;
        if (completed >= 15) return 2;
        if (completed >= 5)  return 1;
        return 0;
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

    /**
     * @notice Set the orchestrator fee for subtasks
     * @param newFeeBps New fee in basis points (max 5000 = 50%)
     */
    function setOrchestratorFeeBps(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 5000, "Max 50%");
        orchestratorFeeBps = newFeeBps;
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
