// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RollinStaking
 * @dev A staking contract that allows users to stake ERC20 tokens and earn rewards
 * @author cristhedev (https://github.com/cris-the-dev)
 */
contract RollinStaking is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // Constants for calculations
    uint256 private constant SECONDS_IN_YEAR = 31557600;

    // 10000 BPS = 100%
    // 5000 BPS = 50%
    // 1000 BPS = 10%
    // 100 BPS = 1%
    // 10 BPS = 0.1%
    // 1 BPS = 0.01%
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant MAX_APY = 50000; // Max 500% APY

    // Fee Vault address
    address private _feeVault;

    // Pool creation fee in native currency
    uint256 private _poolFee;

    // Duration for freeze period in seconds
    uint256 private _freezeDuration;

    // Fee for early unstaking (in basis points)
    uint256 private _freezeFee;

    // Minimum token allocation required for pool creation (in basis points)
    uint256 private _allocationPercent;

    // Array of registered token contracts
    IERC20[] private _registeredContract;

    struct StakingOption {
        bytes32 stakingOptionId;
        uint256 duration; // Duration in seconds
        uint256 apy; // APY in basis points
        bool isActive;
    }

    struct Stake {
        uint256 amount;
        uint256 startTime;
        bytes32 stakingOptionId;
    }

    struct FreezeData {
        IERC20 tokenContract;
        uint256 amount;
        uint256 freezeTime;
    }

    // Mappings
    mapping(IERC20 => mapping(bytes32 => StakingOption))
        private _stakingOptions;
    mapping(address => Stake[]) private _stakingData;
    mapping(address => IERC20[]) private _stakingPools;
    mapping(IERC20 => bytes32[]) private _optionsByTokenContract;
    mapping(bytes32 => uint256) private _optionTvl;
    mapping(address => FreezeData[]) private _freezeData;

    // Events
    event PoolCreated(address indexed creator, address indexed tokenContract);
    event StakingOptionAdded(
        address indexed tokenContract,
        bytes32 indexed optionId,
        uint256 duration,
        uint256 apy
    );
    event Staked(
        address indexed user,
        address indexed tokenContract,
        bytes32 indexed optionId,
        uint256 amount
    );
    event Unstaked(
        address indexed user,
        address indexed tokenContract,
        bytes32 indexed optionId,
        uint256 amount,
        uint256 reward
    );
    event FrozenUnstake(
        address indexed user,
        address indexed tokenContract,
        bytes32 indexed optionId,
        uint256 amount,
        uint256 feeAmount
    );
    event FrozenWithdrawn(
        address indexed user,
        address indexed tokenContract,
        uint256 amount
    );
    event PoolDeposited(
        address indexed user,
        address indexed tokenContract,
        uint256 amount
    );
    event FeeVaultUpdated(address indexed newFeeVault);
    event FreezeDurationUpdated(uint256 newDuration);
    event FreezeFeeUpdated(uint256 newFee);
    event PoolFeeUpdated(uint256 newFee);
    event AllocationPercentUpdated(uint256 newAllocationPercent);

    /**
     * @dev Constructor to initialize the contract
     */
    constructor(
        uint256 defaultPoolFee,
        uint256 allocationPercent,
        uint256 freezeDuration,
        uint256 freezeFee,
        address feeVault
    ) Ownable(msg.sender) {
        require(feeVault != address(0), "Invalid fee vault");
        require(freezeFee <= BASIS_POINTS, "Fee exceeds 100%");
        require(allocationPercent <= BASIS_POINTS, "Allocation exceeds 100%");

        _poolFee = defaultPoolFee;
        _allocationPercent = allocationPercent;
        _freezeDuration = freezeDuration;
        _freezeFee = freezeFee;
        _feeVault = feeVault;
    }

    /**
     * @dev Modifier for pool owner or contract owner
     */
    modifier ownerOrPoolOwner(IERC20 tokenContract) {
        require(
            _isPoolOwner(tokenContract) || owner() == _msgSender(),
            "Not authorized"
        );
        _;
    }

    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setFeeVault(address feeVault) external onlyOwner {
        require(feeVault != address(0), "Invalid fee vault");
        _feeVault = feeVault;
        emit FeeVaultUpdated(feeVault);
    }

    function setFreezeDuration(uint256 freezeDuration) external onlyOwner {
        require(freezeDuration > 0, "Invalid duration");
        _freezeDuration = freezeDuration;
        emit FreezeDurationUpdated(freezeDuration);
    }

    function setFreezeFee(uint256 freezeFee) external onlyOwner {
        require(freezeFee > 0 && freezeFee <= BASIS_POINTS, "Invalid fee");
        _freezeFee = freezeFee;
        emit FreezeFeeUpdated(freezeFee);
    }

    function setPoolFee(uint256 poolFee) external onlyOwner {
        require(poolFee > 0, "Invalid fee");
        _poolFee = poolFee;
        emit PoolFeeUpdated(poolFee);
    }

    function setAllocationPercent(
        uint256 allocationPercent
    ) external onlyOwner {
        require(allocationPercent > 0, "Invalid allocation percent");
        require(allocationPercent <= BASIS_POINTS, "Allocation exceeds 100%");

        _allocationPercent = allocationPercent;

        emit AllocationPercentUpdated(allocationPercent);
    }

    /**
     * @dev Creates a new staking pool for a token
     */
    function addStakingPool(
        IERC20 tokenContract
    ) external payable whenNotPaused {
        require(address(tokenContract) != address(0), "Invalid token");
        require(!_isPoolRegistered(tokenContract), "Pool exists");

        if (_msgSender() != owner()) {
            require(_validPoolCreate(tokenContract), "Insufficient allocation");
            require(msg.value >= _poolFee, "Insufficient fee");

            // Immediately transfer the pool creation fee to fee vault
            (bool success, ) = payable(_feeVault).call{value: msg.value}("");
            require(success, "Fee transfer failed");
        }

        _stakingPools[_msgSender()].push(tokenContract);
        _registeredContract.push(tokenContract);

        emit PoolCreated(_msgSender(), address(tokenContract));
    }

    /**
     * @dev Adds a new staking option to a pool
     */
    function addStakingOption(
        IERC20 tokenContract,
        uint256 duration,
        uint256 apy
    ) external whenNotPaused ownerOrPoolOwner(tokenContract) {
        require(_isPoolRegistered(tokenContract), "Pool not registered");
        require(duration > 0, "Invalid duration");
        require(apy > 0 && apy <= MAX_APY, "Invalid APY");

        bytes32 optionId = keccak256(
            abi.encodePacked(tokenContract, duration, apy, block.timestamp)
        );

        StakingOption memory option = StakingOption(
            optionId,
            duration,
            apy,
            true
        );

        _stakingOptions[tokenContract][optionId] = option;
        _optionsByTokenContract[tokenContract].push(optionId);

        emit StakingOptionAdded(
            address(tokenContract),
            optionId,
            duration,
            apy
        );
    }

    /**
     * @dev Stakes tokens in a specific staking option
     */
    function stake(
        IERC20 tokenContract,
        bytes32 optionId,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(amount > 0, "Invalid amount");
        require(
            _isValidStakingOption(tokenContract, optionId),
            "Invalid option"
        );

        StakingOption memory option = _stakingOptions[tokenContract][optionId];
        uint256 reward = _calculateReward(option.apy, amount, option.duration);

        require(
            reward <= _getAvailablePoolBalance(tokenContract),
            "Insufficient pool balance"
        );

        _updateStake(_msgSender(), optionId, amount);
        _optionTvl[optionId] += amount;

        tokenContract.safeTransferFrom(_msgSender(), address(this), amount);

        emit Staked(_msgSender(), address(tokenContract), optionId, amount);
    }

    /**
     * @dev Unstakes tokens after staking period is complete
     */
    function unstake(
        IERC20 tokenContract,
        bytes32 optionId,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        Stake storage stakeData = _getStakeData(optionId);
        _validateUnstake(tokenContract, optionId, stakeData, amount);
        require(
            _isReleasable(tokenContract, optionId, stakeData),
            "Still locked"
        );

        uint256 reward = _processUnstake(
            tokenContract,
            optionId,
            amount,
            stakeData
        );

        emit Unstaked(
            _msgSender(),
            address(tokenContract),
            optionId,
            amount,
            reward
        );
    }

    /**
     * @dev Early unstake with freeze period
     */
    function unstakeFreeze(
        IERC20 tokenContract,
        bytes32 optionId,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        Stake storage stakeData = _getStakeData(optionId);
        _validateUnstake(tokenContract, optionId, stakeData, amount);

        uint256 freezeAmount = (amount * (BASIS_POINTS - _freezeFee)) /
            BASIS_POINTS;
        uint256 feeAmount = amount - freezeAmount;

        stakeData.amount -= amount;
        _optionTvl[optionId] -= amount;

        _freezeData[_msgSender()].push(
            FreezeData(tokenContract, freezeAmount, block.timestamp)
        );

        tokenContract.safeTransfer(_feeVault, feeAmount);

        emit FrozenUnstake(
            _msgSender(),
            address(tokenContract),
            optionId,
            freezeAmount,
            feeAmount
        );
    }

    /**
     * @dev Withdraws tokens after freeze period
     */
    function withdrawFrozen(
        IERC20 tokenContract
    ) external nonReentrant whenNotPaused {
        uint256 availableBalance = getAvailableFrozen(tokenContract);
        require(availableBalance > 0, "No balance");

        _clearAvailableFrozen(tokenContract);

        tokenContract.safeTransfer(_msgSender(), availableBalance);

        emit FrozenWithdrawn(
            _msgSender(),
            address(tokenContract),
            availableBalance
        );
    }

    // Internal functions
    function _calculateReward(
        uint256 apy,
        uint256 amount,
        uint256 duration
    ) private pure returns (uint256) {
        return (amount * apy * duration) / (BASIS_POINTS * SECONDS_IN_YEAR);
    }

    function _clearAvailableFrozen(IERC20 tokenContract) private {
        FreezeData[] storage data = _freezeData[_msgSender()];
        uint256 j = 0;

        for (uint256 i = 0; i < data.length; i++) {
            if (
                data[i].freezeTime + _freezeDuration > block.timestamp ||
                data[i].tokenContract != tokenContract
            ) {
                if (i != j) {
                    data[j] = data[i];
                }
                j++;
            }
        }

        while (data.length > j) {
            data.pop();
        }
    }

    function _validateUnstake(
        IERC20 tokenContract,
        bytes32 optionId,
        Stake storage stakeData,
        uint256 amount
    ) private view {
        require(
            _isValidStakingOption(tokenContract, optionId),
            "Invalid option"
        );
        require(stakeData.amount > 0, "No stake found");
        require(amount <= stakeData.amount, "Insufficient amount");
    }

    function _updateStake(
        address user,
        bytes32 optionId,
        uint256 amount
    ) private {
        Stake[] storage userStakes = _stakingData[user];

        for (uint256 i = 0; i < userStakes.length; i++) {
            if (userStakes[i].stakingOptionId == optionId) {
                userStakes[i].amount += amount;

                // Reset the start time
                userStakes[i].startTime = block.timestamp;
                return;
            }
        }

        userStakes.push(Stake(amount, block.timestamp, optionId));
    }

    function _processUnstake(
        IERC20 tokenContract,
        bytes32 optionId,
        uint256 amount,
        Stake storage stakeData
    ) private returns (uint256) {
        StakingOption memory option = _stakingOptions[tokenContract][optionId];
        uint256 reward = _calculateReward(option.apy, amount, option.duration);
        uint256 totalAmount = amount + reward;

        require(
            tokenContract.balanceOf(address(this)) >= totalAmount,
            "Insufficient pool"
        );

        stakeData.amount -= amount;
        _optionTvl[optionId] -= amount;

        tokenContract.safeTransfer(_msgSender(), totalAmount);

        return reward;
    }

    // View functions
    function getFreezeDuration() public view returns (uint256) {
        return _freezeDuration;
    }

    function getFreezeFee() public view returns (uint256) {
        return _freezeFee;
    }

    function getPoolFee() public view returns (uint256) {
        return _poolFee;
    }

    function getRegisteredContracts() public view returns (IERC20[] memory) {
        return _registeredContract;
    }

    function getAllocationPercent() public view returns (uint256) {
        return _allocationPercent;
    }

    function getStakingOptions(
        IERC20 tokenContract
    ) public view returns (StakingOption[] memory) {
        bytes32[] memory optionIds = _optionsByTokenContract[tokenContract];
        StakingOption[] memory result = new StakingOption[](optionIds.length);

        for (uint256 i = 0; i < optionIds.length; i++) {
            result[i] = _stakingOptions[tokenContract][optionIds[i]];
        }

        return result;
    }

    function getStakingData() public view returns (Stake[] memory) {
        return _stakingData[_msgSender()];
    }

    function getAvailableFrozen(
        IERC20 tokenContract
    ) public view returns (uint256) {
        FreezeData[] memory data = _freezeData[_msgSender()];
        uint256 result = 0;

        for (uint256 i = 0; i < data.length; i++) {
            if (
                data[i].freezeTime + _freezeDuration <= block.timestamp &&
                data[i].tokenContract == tokenContract
            ) {
                result += data[i].amount;
            }
        }
        return result;
    }

    function getFreezingBalance(
        IERC20 tokenContract
    ) public view returns (uint256) {
        FreezeData[] memory data = _freezeData[_msgSender()];
        uint256 result = 0;

        for (uint256 i = 0; i < data.length; i++) {
            if (
                data[i].freezeTime + _freezeDuration > block.timestamp &&
                data[i].tokenContract == tokenContract
            ) {
                result += data[i].amount;
            }
        }

        return result;
    }

    function getOwnedStakingPools(
        address owner
    ) external view returns (IERC20[] memory) {
        return _stakingPools[owner];
    }

    function getTotalStakedAmount(
        IERC20 tokenContract
    ) external view returns (uint256) {
        bytes32[] memory optionIds = _optionsByTokenContract[tokenContract];
        uint256 totalStaked = 0;

        for (uint256 i = 0; i < optionIds.length; i++) {
            totalStaked += _optionTvl[optionIds[i]];
        }

        return totalStaked;
    }

    function _isPoolOwner(IERC20 tokenContract) private view returns (bool) {
        IERC20[] memory owningPools = _stakingPools[_msgSender()];
        for (uint256 i = 0; i < owningPools.length; i++) {
            if (owningPools[i] == tokenContract) return true;
        }
        return false;
    }

    function _isPoolRegistered(
        IERC20 tokenContract
    ) private view returns (bool) {
        for (uint256 i = 0; i < _registeredContract.length; i++) {
            if (_registeredContract[i] == tokenContract) return true;
        }
        return false;
    }

    function _isValidStakingOption(
        IERC20 tokenContract,
        bytes32 optionId
    ) private view returns (bool) {
        return _stakingOptions[tokenContract][optionId].isActive;
    }

    function _validPoolCreate(
        IERC20 tokenContract
    ) private view returns (bool) {
        uint256 balance = tokenContract.balanceOf(_msgSender());
        return balance >= tokenContract.totalSupply() / _allocationPercent;
    }

    function _getStakeData(
        bytes32 optionId
    ) private view returns (Stake storage) {
        Stake[] storage userStakes = _stakingData[_msgSender()];
        for (uint256 i = 0; i < userStakes.length; i++) {
            if (userStakes[i].stakingOptionId == optionId) {
                return userStakes[i];
            }
        }
        revert("Stake not found");
    }

    function _isReleasable(
        IERC20 tokenContract,
        bytes32 optionId,
        Stake memory data
    ) private view returns (bool) {
        StakingOption memory option = _stakingOptions[tokenContract][optionId];
        return option.duration + data.startTime <= block.timestamp;
    }

    function estimateReward(
        IERC20 tokenContract,
        bytes32 optionId,
        uint256 stakingAmount
    ) external view returns (uint256) {
        require(
            _isValidStakingOption(tokenContract, optionId),
            "Invalid option"
        );
        StakingOption memory option = _stakingOptions[tokenContract][optionId];
        return _calculateReward(option.apy, stakingAmount, option.duration);
    }

    function _getAvailablePoolBalance(
        IERC20 tokenContract
    ) private view returns (uint256) {
        StakingOption[] memory options = getStakingOptions(tokenContract);
        uint256 reserved = 0;

        for (uint256 i = 0; i < options.length; i++) {
            bytes32 optionId = options[i].stakingOptionId;
            uint256 tvl = _optionTvl[optionId];
            if (tvl > 0) {
                reserved += _calculateReward(
                    options[i].apy,
                    tvl,
                    options[i].duration
                );
            }
        }

        return tokenContract.balanceOf(address(this)) - reserved;
    }

    function getAvailablePoolBalance(
        IERC20 tokenContract
    ) external view returns (uint256) {
        return _getAvailablePoolBalance(tokenContract);
    }

    // Functions for emergency situations
    function emergencyWithdraw(
        IERC20 tokenContract
    ) external onlyOwner whenPaused {
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance > 0, "No balance");
        tokenContract.safeTransfer(_feeVault, balance);
    }

    function withdrawNative() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        payable(_feeVault).transfer(balance);
    }
}
