// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HireToken ($HIRE)
 * @notice Revenue-sharing and work-mining token for the clawhire protocol.
 *
 * @dev Capped supply of 100M tokens. 60% minted at deployment for treasury,
 *      staking rewards, team, and community. 40% reserved for Work Mining —
 *      minted as tasks are completed on the platform.
 *
 * Work Mining:
 * - When a task is completed, both worker and poster receive $HIRE
 * - Worker gets 80%, poster gets 20% of the mined amount
 * - Mining rate starts at 10 $HIRE per 1 USDC of task value (epoch 1)
 * - Rate halves every 180 days (epoch-based halving)
 * - Mining stops when MINING_POOL (40M) is exhausted
 *
 * Burn:
 * - Anyone can burn their own tokens via burn()
 * - Protocol can burn via burnFrom() with allowance
 */
contract HireToken is ERC20, ERC20Burnable, Ownable {
    /// @notice Maximum token supply (100M with 18 decimals)
    uint256 public constant MAX_SUPPLY = 100_000_000e18;

    /// @notice Tokens reserved for work mining (40% = 40M)
    uint256 public constant MINING_POOL = 40_000_000e18;

    /// @notice Duration of each mining epoch (180 days)
    uint256 public constant EPOCH_DURATION = 180 days;

    /// @notice Initial mining rate: 10 HIRE per 1 USDC of task value
    uint256 public constant INITIAL_RATE = 10;

    /// @notice Total tokens mined through work so far
    uint256 public totalMined;

    /// @notice Timestamp when mining started (set in constructor)
    uint256 public miningStartTime;

    /// @notice Authorized minter address (TaskEscrow contract)
    address public minter;

    // --- Events ---
    event MinterUpdated(address indexed oldMinter, address indexed newMinter);
    event WorkMined(
        address indexed worker,
        address indexed poster,
        uint256 workerAmount,
        uint256 posterAmount,
        uint256 epoch
    );

    // --- Errors ---
    error OnlyMinter();
    error MiningPoolExhausted();
    error InvalidAddress();

    /**
     * @notice Deploy HireToken with initial allocations
     * @param _treasury Address receiving treasury + community tokens
     * @param _team Address receiving team allocation
     * @dev 25% Treasury (25M) + 10% Community (10M) → treasury address
     *      15% Staking Rewards (15M) → treasury (transferred to RevenueShare later)
     *      10% Team (10M) → team address
     *      40% unminted (mined through work)
     */
    constructor(
        address _treasury,
        address _team
    ) ERC20("hire", "HIRE") Ownable(msg.sender) {
        require(_treasury != address(0) && _team != address(0), "Invalid address");

        miningStartTime = block.timestamp;

        // 25% Treasury (25M) + 10% Community (10M) = 35M → treasury
        _mint(_treasury, 35_000_000e18);

        // 15% Staking Rewards (15M) → treasury (to be transferred to RevenueShare)
        _mint(_treasury, 15_000_000e18);

        // 10% Team (10M) → team address
        _mint(_team, 10_000_000e18);

        // Total initial mint: 60M. Remaining 40M mined through work.
    }

    // =============================================================
    //                       MINTER MANAGEMENT
    // =============================================================

    /**
     * @notice Set the authorized minter (TaskEscrow contract)
     * @param _minter Address of the minter contract
     */
    function setMinter(address _minter) external onlyOwner {
        if (_minter == address(0)) revert InvalidAddress();
        emit MinterUpdated(minter, _minter);
        minter = _minter;
    }

    // =============================================================
    //                       WORK MINING
    // =============================================================

    /**
     * @notice Get the current mining epoch (0-indexed)
     * @return epoch Current epoch number
     */
    function currentEpoch() public view returns (uint256 epoch) {
        return (block.timestamp - miningStartTime) / EPOCH_DURATION;
    }

    /**
     * @notice Get the current mining rate (HIRE per 1 USDC of task value)
     * @dev Rate halves each epoch: epoch 0 = 10, epoch 1 = 5, epoch 2 = 2, etc.
     * @return rate Current mining rate
     */
    function miningRate() public view returns (uint256 rate) {
        uint256 epoch = currentEpoch();
        rate = INITIAL_RATE;
        for (uint256 i = 0; i < epoch; i++) {
            rate = rate / 2;
            if (rate == 0) return 0;
        }
        return rate;
    }

    /**
     * @notice Mint $HIRE tokens for completed work (Work Mining)
     * @dev Only callable by the authorized minter (TaskEscrow).
     *      Worker receives 80%, poster receives 20%.
     * @param worker Address of the task worker
     * @param poster Address of the task poster
     * @param taskValueUSDC Value of the completed task in USDC (6 decimals)
     */
    function mintForWork(
        address worker,
        address poster,
        uint256 taskValueUSDC
    ) external {
        if (msg.sender != minter) revert OnlyMinter();

        uint256 rate = miningRate();
        if (rate == 0) revert MiningPoolExhausted();

        // Calculate total HIRE to mint: taskValueUSDC * rate / 1e6 (USDC has 6 decimals)
        // Result is in 18 decimals (HIRE)
        uint256 totalAmount = (taskValueUSDC * rate * 1e18) / 1e6;

        if (totalMined + totalAmount > MINING_POOL) revert MiningPoolExhausted();

        uint256 workerAmount = (totalAmount * 80) / 100;
        uint256 posterAmount = totalAmount - workerAmount;

        totalMined += totalAmount;

        _mint(worker, workerAmount);
        _mint(poster, posterAmount);

        emit WorkMined(worker, poster, workerAmount, posterAmount, currentEpoch());
    }
}
