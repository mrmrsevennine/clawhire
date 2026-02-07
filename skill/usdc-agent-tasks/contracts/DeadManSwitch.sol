// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DeadManSwitch
 * @notice Trust mechanism for the clawhire protocol. If the protocol owner
 *         fails to send a heartbeat within 90 days, anyone can trigger
 *         emergency distribution of all tokens held by this contract.
 *
 * @dev After emergency distribution is triggered:
 *      - HIRE holders can claim their pro-rata share of USDC and HIRE
 *      - Claims are based on HIRE balance at the time of emergency trigger
 *      - Each holder can only claim once
 *      - Owner cannot recover tokens after abandonment
 *
 * Usage:
 *   1. Protocol treasury deposits USDC + HIRE into this contract
 *   2. Owner calls heartbeat() periodically (at least every 90 days)
 *   3. If owner disappears, anyone can call emergencyDistribute() after 90 days
 *   4. Holders call claimEmergency() to get their share
 */
contract DeadManSwitch is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Contract owner who must send heartbeats
    address public owner;

    /// @notice Timestamp of last heartbeat
    uint256 public lastHeartbeat;

    /// @notice Time before contract is considered abandoned (90 days)
    uint256 public constant DEAD_THRESHOLD = 90 days;

    /// @notice The HIRE token
    IERC20 public hireToken;

    /// @notice The USDC token
    IERC20 public usdc;

    /// @notice Whether emergency distribution has been triggered
    bool public emergencyTriggered;

    /// @notice Snapshot values at time of emergency
    uint256 public snapshotHireSupply;
    uint256 public snapshotUsdcBalance;
    uint256 public snapshotHireBalance;

    /// @notice Track who has claimed
    mapping(address => bool) public hasClaimed;

    // --- Events ---
    event HeartbeatSent(uint256 timestamp);
    event EmergencyDistribution(uint256 usdcAmount, uint256 hireAmount);
    event EmergencyClaimed(address indexed claimant, uint256 usdcAmount, uint256 hireAmount);
    event TokensRecovered(address indexed token, uint256 amount);

    // --- Errors ---
    error OnlyOwner();
    error NotAbandoned();
    error AlreadyAbandoned();
    error EmergencyNotTriggered();
    error AlreadyClaimed();
    error NothingToClaim();

    constructor(address _hireToken, address _usdc) {
        require(_hireToken != address(0) && _usdc != address(0), "Invalid address");
        owner = msg.sender;
        lastHeartbeat = block.timestamp;
        hireToken = IERC20(_hireToken);
        usdc = IERC20(_usdc);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    // =============================================================
    //                       HEARTBEAT
    // =============================================================

    /**
     * @notice Send a heartbeat to prove the protocol is still active
     * @dev Only callable by the owner. Resets the dead timer.
     */
    function heartbeat() external onlyOwner {
        if (emergencyTriggered) revert AlreadyAbandoned();
        lastHeartbeat = block.timestamp;
        emit HeartbeatSent(block.timestamp);
    }

    /**
     * @notice Check if the protocol is considered abandoned
     * @return True if more than DEAD_THRESHOLD has passed since last heartbeat
     */
    function isAbandoned() public view returns (bool) {
        return block.timestamp > lastHeartbeat + DEAD_THRESHOLD;
    }

    // =============================================================
    //                    EMERGENCY DISTRIBUTION
    // =============================================================

    /**
     * @notice Trigger emergency distribution if protocol is abandoned
     * @dev Anyone can call this after 90 days without heartbeat.
     *      Takes a snapshot of balances for pro-rata claims.
     */
    function emergencyDistribute() external nonReentrant {
        if (!isAbandoned()) revert NotAbandoned();
        if (emergencyTriggered) revert AlreadyAbandoned();

        emergencyTriggered = true;

        // Snapshot balances at this moment
        snapshotUsdcBalance = usdc.balanceOf(address(this));
        snapshotHireBalance = hireToken.balanceOf(address(this));
        snapshotHireSupply = hireToken.totalSupply();

        emit EmergencyDistribution(snapshotUsdcBalance, snapshotHireBalance);
    }

    /**
     * @notice Claim your pro-rata share of emergency-distributed tokens
     * @dev Amount = (userHireBalance / totalHireSupply) * contractBalances
     *      Each holder can only claim once.
     */
    function claimEmergency() external nonReentrant {
        if (!emergencyTriggered) revert EmergencyNotTriggered();
        if (hasClaimed[msg.sender]) revert AlreadyClaimed();

        uint256 userHireBalance = hireToken.balanceOf(msg.sender);
        if (userHireBalance == 0) revert NothingToClaim();

        hasClaimed[msg.sender] = true;

        // Calculate pro-rata shares
        uint256 usdcShare = (snapshotUsdcBalance * userHireBalance) / snapshotHireSupply;
        uint256 hireShare = (snapshotHireBalance * userHireBalance) / snapshotHireSupply;

        if (usdcShare > 0) {
            usdc.safeTransfer(msg.sender, usdcShare);
        }
        if (hireShare > 0) {
            hireToken.safeTransfer(msg.sender, hireShare);
        }

        emit EmergencyClaimed(msg.sender, usdcShare, hireShare);
    }

    // =============================================================
    //                    OWNER RECOVERY
    // =============================================================

    /**
     * @notice Recover tokens from contract (owner only, NOT when abandoned)
     * @param token Address of the token to recover
     * @param amount Amount to recover
     */
    function recoverTokens(address token, uint256 amount) external onlyOwner nonReentrant {
        if (isAbandoned()) revert AlreadyAbandoned();
        IERC20(token).safeTransfer(owner, amount);
        emit TokensRecovered(token, amount);
    }
}
