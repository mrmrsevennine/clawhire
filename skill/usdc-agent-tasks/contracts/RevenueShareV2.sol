// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title RevenueShareV2
 * @notice Stake $HIRE tokens to earn USDC from clawhire platform fees.
 *
 * V2 Changes:
 * - Fee split changed from 50/50 to 50/30/20 (stakers/treasury/burn)
 * - 20% of revenue allocated to buy-back & burn $HIRE
 * - Burn allocation sent to a dead address for transparency
 * - Configurable burn basis points
 *
 * HOW IT WORKS:
 * 1. The TaskEscrowV2 contract's feeRecipient is set to this contract
 * 2. When tasks are approved, platform fees (USDC) are sent here automatically
 * 3. Stakers earn USDC proportional to their share of the staking pool
 * 4. Uses a "reward per token" accumulator pattern (like Synthetix StakingRewards)
 *
 * DESIGN:
 * - Stake/unstake $HIRE at any time (no lock period)
 * - Rewards accumulate automatically as fees arrive
 * - Claim USDC rewards at any time
 * - Fee split: 50% stakers, 30% treasury, 20% burn allocation
 */
contract RevenueShareV2 is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ─── State ────────────────────────────────────────────────────
    IERC20 public immutable hireToken;      // $HIRE staking token
    IERC20 public immutable usdc;           // USDC reward token
    address public treasury;                // Protocol treasury address

    /// @notice Dead address for burn allocation tracking
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // Fee split (basis points, must sum to 10000)
    uint256 public treasuryBps = 3000;     // 30% to treasury
    uint256 public burnBps = 2000;          // 20% to burn allocation
    // Staker share = 10000 - treasuryBps - burnBps = 50%
    uint256 private constant BPS = 10000;
    uint256 public constant MAX_BURN_BPS = 5000; // Max 50% burn

    // Staking state
    uint256 public totalStaked;
    mapping(address => uint256) public staked;

    // Reward accumulator (Synthetix pattern)
    uint256 private constant PRECISION = 1e30;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    // Stats
    uint256 public totalDistributed;  // Total USDC distributed to stakers
    uint256 public totalToTreasury;   // Total USDC sent to treasury
    uint256 public totalBurned;       // Total USDC allocated to burn

    // ─── Events ───────────────────────────────────────────────────
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RevenueReceived(uint256 total, uint256 toStakers, uint256 toTreasury, uint256 toBurn);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event TreasuryBpsUpdated(uint256 oldBps, uint256 newBps);
    event BurnBpsUpdated(uint256 oldBps, uint256 newBps);
    event RevenueBurned(uint256 amount);

    // ─── Errors ───────────────────────────────────────────────────
    error ZeroAmount();
    error InsufficientStake();
    error NoRewards();
    error InvalidAddress();
    error InvalidBps();
    error BurnBpsTooHigh();

    // ─── Constructor ──────────────────────────────────────────────
    constructor(
        address _hireToken,
        address _usdc,
        address _treasury
    ) Ownable(msg.sender) {
        require(
            _hireToken != address(0) && _usdc != address(0) && _treasury != address(0),
            "Invalid address"
        );
        hireToken = IERC20(_hireToken);
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
     * @notice Current reward per token (scaled by PRECISION)
     */
    function rewardPerToken() public view returns (uint256) {
        return rewardPerTokenStored;
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
        uint256 sharePercent
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
        uint256 _totalBurned,
        uint256 _treasuryBps,
        uint256 _burnBps
    ) {
        return (totalStaked, totalDistributed, totalToTreasury, totalBurned, treasuryBps, burnBps);
    }

    // ─── Staking ──────────────────────────────────────────────────

    /**
     * @notice Stake $HIRE tokens to start earning USDC rewards
     * @param amount Amount of $HIRE to stake (18 decimals)
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();

        totalStaked += amount;
        staked[msg.sender] += amount;

        hireToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Unstake $HIRE tokens (rewards keep accumulating until claimed)
     * @param amount Amount of $HIRE to unstake
     */
    function unstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();
        if (staked[msg.sender] < amount) revert InsufficientStake();

        totalStaked -= amount;
        staked[msg.sender] -= amount;

        hireToken.safeTransfer(msg.sender, amount);
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

    // ─── Revenue Distribution ─────────────────────────────────────

    /**
     * @notice Distribute USDC revenue to stakers, treasury, and burn allocation.
     * @dev Split: 50% stakers, 30% treasury, 20% burn (default).
     *      Burn portion is sent to dead address for transparency.
     * @param amount Amount of USDC to distribute (must already be in contract)
     */
    function distributeRevenue(uint256 amount) external nonReentrant updateReward(address(0)) {
        if (amount == 0) revert ZeroAmount();

        uint256 balance = usdc.balanceOf(address(this));
        require(amount <= balance, "Insufficient USDC balance");

        uint256 toTreasury = (amount * treasuryBps) / BPS;
        uint256 toBurn = (amount * burnBps) / BPS;
        uint256 toStakers = amount - toTreasury - toBurn;

        // Send treasury share
        if (toTreasury > 0) {
            usdc.safeTransfer(treasury, toTreasury);
            totalToTreasury += toTreasury;
        }

        // Send burn allocation to dead address
        if (toBurn > 0) {
            usdc.safeTransfer(BURN_ADDRESS, toBurn);
            totalBurned += toBurn;
            emit RevenueBurned(toBurn);
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

        emit RevenueReceived(amount, toStakers, toTreasury, toBurn);
    }

    // ─── Admin ────────────────────────────────────────────────────

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setTreasuryBps(uint256 newBps) external onlyOwner {
        if (newBps + burnBps > BPS) revert InvalidBps();
        emit TreasuryBpsUpdated(treasuryBps, newBps);
        treasuryBps = newBps;
    }

    /**
     * @notice Set the burn allocation basis points
     * @param newBps New burn BPS (max 5000 = 50%)
     */
    function setBurnBps(uint256 newBps) external onlyOwner {
        if (newBps > MAX_BURN_BPS) revert BurnBpsTooHigh();
        if (newBps + treasuryBps > BPS) revert InvalidBps();
        emit BurnBpsUpdated(burnBps, newBps);
        burnBps = newBps;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @notice Emergency: recover tokens accidentally sent to contract
     * @dev Cannot recover staked HIRE tokens
     */
    function recoverToken(address token, uint256 amount) external onlyOwner {
        if (token == address(hireToken)) {
            uint256 excess = IERC20(token).balanceOf(address(this)) - totalStaked;
            require(amount <= excess, "Cannot recover staked tokens");
        }
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}
