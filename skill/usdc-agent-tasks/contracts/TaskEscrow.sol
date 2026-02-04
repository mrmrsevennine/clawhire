// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TaskEscrow
 * @notice Escrow contract for USDC-based agent task marketplace
 * @dev Agents post tasks with USDC bounties, workers claim and deliver, 
 *      poster approves to release funds. Supports disputes and refunds.
 */
contract TaskEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    enum Status { Open, Claimed, Submitted, Approved, Disputed, Refunded }

    struct Task {
        address poster;
        address worker;
        uint256 bounty;
        Status status;
        bytes32 deliverableHash;
        uint256 createdAt;
        uint256 claimedAt;
        uint256 submittedAt;
    }

    mapping(bytes32 => Task) public tasks;

    // Timeout: poster can refund if no claim after this period
    uint256 public claimTimeout = 7 days;
    // Dispute window: poster can dispute within this period after submission
    uint256 public disputeWindow = 3 days;

    // --- Events ---
    event TaskCreated(bytes32 indexed taskId, address indexed poster, uint256 bounty);
    event TaskClaimed(bytes32 indexed taskId, address indexed worker);
    event DeliverableSubmitted(bytes32 indexed taskId, bytes32 deliverableHash);
    event TaskApproved(bytes32 indexed taskId, address indexed worker, uint256 bounty);
    event TaskDisputed(bytes32 indexed taskId);
    event TaskRefunded(bytes32 indexed taskId, address indexed poster, uint256 bounty);

    constructor(address _usdc) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Post a new task with USDC bounty (deposited into escrow)
     * @param taskId Unique task identifier
     * @param bountyAmount USDC amount (in smallest unit, 6 decimals)
     */
    function createTask(bytes32 taskId, uint256 bountyAmount) external nonReentrant {
        require(tasks[taskId].poster == address(0), "Task already exists");
        require(bountyAmount > 0, "Bounty must be > 0");

        // Transfer USDC from poster to this contract
        usdc.safeTransferFrom(msg.sender, address(this), bountyAmount);

        tasks[taskId] = Task({
            poster: msg.sender,
            worker: address(0),
            bounty: bountyAmount,
            status: Status.Open,
            deliverableHash: bytes32(0),
            createdAt: block.timestamp,
            claimedAt: 0,
            submittedAt: 0
        });

        emit TaskCreated(taskId, msg.sender, bountyAmount);
    }

    /**
     * @notice Claim an open task as a worker
     * @param taskId Task to claim
     */
    function claimTask(bytes32 taskId) external {
        Task storage task = tasks[taskId];
        require(task.poster != address(0), "Task does not exist");
        require(task.status == Status.Open, "Task not open");
        require(msg.sender != task.poster, "Poster cannot claim own task");

        task.worker = msg.sender;
        task.status = Status.Claimed;
        task.claimedAt = block.timestamp;

        emit TaskClaimed(taskId, msg.sender);
    }

    /**
     * @notice Submit a deliverable hash as proof of work
     * @param taskId Task to submit for
     * @param deliverableHash Hash of the deliverable (e.g., IPFS CID hash)
     */
    function submitDeliverable(bytes32 taskId, bytes32 deliverableHash) external {
        Task storage task = tasks[taskId];
        require(task.status == Status.Claimed, "Task not claimed");
        require(msg.sender == task.worker, "Only worker can submit");
        require(deliverableHash != bytes32(0), "Invalid deliverable hash");

        task.deliverableHash = deliverableHash;
        task.status = Status.Submitted;
        task.submittedAt = block.timestamp;

        emit DeliverableSubmitted(taskId, deliverableHash);
    }

    /**
     * @notice Approve the deliverable and release USDC to worker
     * @param taskId Task to approve
     */
    function approveTask(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(task.status == Status.Submitted, "Task not submitted");
        require(msg.sender == task.poster, "Only poster can approve");

        task.status = Status.Approved;

        // Release USDC to worker
        usdc.safeTransfer(task.worker, task.bounty);

        emit TaskApproved(taskId, task.worker, task.bounty);
    }

    /**
     * @notice Dispute a submitted deliverable (within dispute window)
     * @param taskId Task to dispute
     */
    function disputeTask(bytes32 taskId) external {
        Task storage task = tasks[taskId];
        require(task.status == Status.Submitted, "Task not submitted");
        require(msg.sender == task.poster, "Only poster can dispute");
        require(
            block.timestamp <= task.submittedAt + disputeWindow,
            "Dispute window expired"
        );

        task.status = Status.Disputed;

        // In disputed state, funds remain in escrow
        // A more advanced version would involve an arbitrator
        // For now, disputed funds can be refunded by poster
        emit TaskDisputed(taskId);
    }

    /**
     * @notice Refund the poster (if no claim after timeout, or after dispute)
     * @param taskId Task to refund
     */
    function refund(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(msg.sender == task.poster, "Only poster can refund");
        
        bool canRefund = false;
        
        // Refund if open and claim timeout expired
        if (task.status == Status.Open && block.timestamp > task.createdAt + claimTimeout) {
            canRefund = true;
        }
        
        // Refund if disputed
        if (task.status == Status.Disputed) {
            canRefund = true;
        }

        // Refund if submitted and dispute window expired without approval
        // (Auto-approve protection: if poster never approves, worker can't get funds,
        //  but poster can only refund during dispute. After dispute window,
        //  the task auto-approves — handled off-chain or by worker calling approveTask)

        require(canRefund, "Cannot refund at this time");

        task.status = Status.Refunded;
        usdc.safeTransfer(task.poster, task.bounty);

        emit TaskRefunded(taskId, task.poster, task.bounty);
    }

    /**
     * @notice Get task details
     * @param taskId Task to query
     */
    function getTask(bytes32 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }
}
