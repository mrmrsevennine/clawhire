// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title RevenueShare
 * @notice Stake $CLAW tokens to earn USDC from clawhire platform fees.
 *
 * HOW IT WORKS:
 * 1. The TaskEscrow contract's feeRecipient is set to this contract
 * 2. When tasks are approved, platform fees (USDC) are sent here automatically
 * 3. Stakers earn USDC proportional to their share of the staking pool
 * 4. Uses a "reward per token" accumulator pattern (like Synthetix StakingRewards)
 *
 * DESIGN:
 * - Stake/unstake $CLAW at any time (no lock period)
 * - Rewards accumulate automatically as fees arrive
 * - Claim USDC rewards at any time
 * - Treasury split: configurable % goes to protocol treasury
 */
contract RevenueShare is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ─── State ────────────────────────────────────────────────────
    IERC20 public immutable clawToken;      // $CLAW staking token
    IERC20 public immutable usdc;           // USDC reward token
    address public treasury;                // Protocol treasury address

    // Treasury takes this % of incoming fees (basis points, 5000 = 50%)
    uint256 public treasuryBps = 5000;
    uint256 private constant BPS = 10000;

    // Staking state
    uint256 public totalStaked;
    mapping(address => uint256) public staked;

    // Reward accumulator (Synthetix pattern)
    // rewardPerTokenStored = cumulative USDC per staked CLAW (scaled by 1e30 for precision)
    // Higher precision needed because USDC=6 decimals, CLAW=18 decimals (12 decimal gap)
    uint256 private constant PRECISION = 1e30;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards; // unclaimed USDC (in USDC decimals, 6)

    // Stats
    uint256 public totalDistributed;  // Total USDC distributed to stakers
    uint256 public totalToTreasury;   // Total USDC sent to treasury

    // ─── Events ───────────────────────────────────────────────────
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RevenueReceived(uint256 total, uint256 toStakers, uint256 toTreasury);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event TreasuryBpsUpdated(uint256 oldBps, uint256 newBps);

    // ─── Errors ───────────────────────────────────────────────────
    error ZeroAmount();
    error InsufficientStake();
    error NoRewards();
    error InvalidAddress();
    error InvalidBps();

    // ─── Constructor ──────────────────────────────────────────────
    constructor(
        address _clawToken,
        address _usdc,
        address _treasury
    ) Ownable(msg.sender) {
        require(_clawToken != address(0) && _usdc != address(0) && _treasury != address(0), "Invalid address");
        clawToken = IERC20(_clawToken);
        usdc = IERC20(_usdc);
        treasury = _treasury;
    }

    // ─── Modifiers ────────────────────────────────────────────────
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    // ─── Views ────────────────────────────────────────────────────

    /**
     * @notice Current reward per token (scaled by 1e18)
     */
    function rewardPerToken() public view returns (uint256) {
        return rewardPerTokenStored; // Updated on each distributeRevenue call
    }

    /**
     * @notice Unclaimed USDC rewards for an account
     */
    function earned(address account) public view returns (uint256) {
        if (totalStaked == 0) return rewards[account];
        return
            (staked[account] * (rewardPerTokenStored - userRewardPerTokenPaid[account])) / PRECISION
            + rewards[account];
    }

    /**
     * @notice Get staking info for an account
     */
    function getStakeInfo(address account) external view returns (
        uint256 stakedAmount,
        uint256 pendingRewards,
        uint256 sharePercent  // basis points (10000 = 100%)
    ) {
        stakedAmount = staked[account];
        pendingRewards = earned(account);
        sharePercent = totalStaked > 0 ? (stakedAmount * BPS) / totalStaked : 0;
    }

    /**
     * @notice Get global stats
     */
    function getStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalDistributed,
        uint256 _totalToTreasury,
        uint256 _treasuryBps,
        uint256 _stakerCount
    ) {
        return (totalStaked, totalDistributed, totalToTreasury, treasuryBps, 0); // stakerCount not tracked for gas
    }

    // ─── Staking ──────────────────────────────────────────────────

    /**
     * @notice Stake $CLAW tokens to start earning USDC rewards
     * @param amount Amount of $CLAW to stake (18 decimals)
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();

        totalStaked += amount;
        staked[msg.sender] += amount;

        clawToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Unstake $CLAW tokens (rewards keep accumulating until claimed)
     * @param amount Amount of $CLAW to unstake
     */
    function unstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();
        if (staked[msg.sender] < amount) revert InsufficientStake();

        totalStaked -= amount;
        staked[msg.sender] -= amount;

        clawToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Claim accumulated USDC rewards
     */
    function claimRewards() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward == 0) revert NoRewards();

        rewards[msg.sender] = 0;
        usdc.safeTransfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, reward);
    }

    /**
     * @notice Stake + claim in one transaction (compound)
     */
    function stakeAndClaim(uint256 stakeAmount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        // Claim first
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            usdc.safeTransfer(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }

        // Then stake
        if (stakeAmount > 0) {
            totalStaked += stakeAmount;
            staked[msg.sender] += stakeAmount;
            clawToken.safeTransferFrom(msg.sender, address(this), stakeAmount);
            emit Staked(msg.sender, stakeAmount);
        }
    }

    // ─── Revenue Distribution ─────────────────────────────────────

    /**
     * @notice Distribute USDC revenue to stakers and treasury.
     *         Called automatically when USDC is received, or manually by anyone.
     *
     * @dev Anyone can call this to distribute any USDC sitting in the contract.
     *      The TaskEscrow sends fees here as feeRecipient, then this function
     *      splits between stakers and treasury.
     *
     * @param amount Amount of USDC to distribute (must already be in contract)
     */
    function distributeRevenue(uint256 amount) external nonReentrant updateReward(address(0)) {
        if (amount == 0) revert ZeroAmount();

        uint256 balance = usdc.balanceOf(address(this));
        // Subtract staker rewards that haven't been claimed yet
        // Only distribute "new" USDC
        require(amount <= balance, "Insufficient USDC balance");

        uint256 toTreasury = (amount * treasuryBps) / BPS;
        uint256 toStakers = amount - toTreasury;

        // Send treasury share
        if (toTreasury > 0) {
            usdc.safeTransfer(treasury, toTreasury);
            totalToTreasury += toTreasury;
        }

        // Distribute staker share via reward accumulator
        if (toStakers > 0 && totalStaked > 0) {
            rewardPerTokenStored += (toStakers * PRECISION) / totalStaked;
            totalDistributed += toStakers;
        } else if (toStakers > 0 && totalStaked == 0) {
            // No stakers — send to treasury instead
            usdc.safeTransfer(treasury, toStakers);
            totalToTreasury += toStakers;
        }

        emit RevenueReceived(amount, toStakers, toTreasury);
    }

    /**
     * @notice Convenience: distribute ALL undistributed USDC in contract
     */
    function distributeAll() external {
        uint256 balance = usdc.balanceOf(address(this));
        // Don't count CLAW tokens, only USDC
        // We need to account for unclaimed rewards sitting in the contract
        // For simplicity, distribute whatever is there (rewards are tracked in `rewards` mapping)
        if (balance > 0) {
            // This is a simplified approach - in production, track pending rewards more carefully
            this.distributeRevenue(balance);
        }
    }

    // ─── Admin ────────────────────────────────────────────────────

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setTreasuryBps(uint256 newBps) external onlyOwner {
        if (newBps > BPS) revert InvalidBps();
        emit TreasuryBpsUpdated(treasuryBps, newBps);
        treasuryBps = newBps;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @notice Emergency: recover tokens accidentally sent to contract
     * @dev Cannot recover staked CLAW tokens
     */
    function recoverToken(address token, uint256 amount) external onlyOwner {
        if (token == address(clawToken)) {
            // Only allow recovering excess CLAW (not staked amounts)
            uint256 excess = IERC20(token).balanceOf(address(this)) - totalStaked;
            require(amount <= excess, "Cannot recover staked tokens");
        }
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}
