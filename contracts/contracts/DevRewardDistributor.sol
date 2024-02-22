// SPDX-License-Identifier: Apache-2.0

pragma solidity >=0.8.15;

import "./FluenceToken.sol";
import "./Executor.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title DevRewardDistributor
 * @notice Contract for managing developers reward
 */
contract DevRewardDistributor {
    using SafeERC20 for IERC20;

    struct LockedBalance {
        uint256 amount;
        uint256 unlockTime;
    }

    /**
     * @notice Reward token
     *
     */
    FluenceToken public immutable token;

    /**
     * @notice DAO timelock contract address
     *
     */
    Executor public immutable executor;

    /**
     * @notice Canceler address (e.g. FluenceMultisig)
     *
     */
    address public immutable canceler;

    /**
     * @notice Claiming end time
     *
     */
    uint256 public immutable claimingEndTime;

    /**
     * @notice Time when this contract was deployed
     *
     */
    uint256 public immutable deployTime;

    /**
     * @notice Merkle root from rewards tree
     *
     */
    bytes32 public immutable merkleRoot;

    /**
     * @notice Period for dividing the reward
     *
     */
    uint256 public immutable halvePeriod;

    /**
     * @notice Returns the vesting contract decimals
     *
     */
    uint8 public immutable decimals;

    /**
     * @notice Initial user's reward
     *
     */
    uint256 public immutable initialReward;

    uint256 public immutable lockupPeriod;

    uint256 public immutable maxClaimedSupply;

    uint256 public claimedSupply;

    uint256 private _totalSupply;

    /**
     * @notice Bitmap with claimed users ids
     *
     */
    mapping(uint256 => uint256) private claimedBitMap;

    mapping(address => LockedBalance) public lockedBalances;

    /**
     * @notice Emitted when user claims reward
     * @param userId - reward user id
     * @param account - reward account
     * @param amount - reward amount
     * @param leaf - leaf with user's info in reward tree
     *
     */
    event Claimed(uint256 indexed userId, address account, uint256 amount, bytes32 leaf);

    /**
     * @notice Emitted when claiming period is ended and tokens transfer to the executor
     * @param amount - remainder balance
     *
     */
    event TransferUnclaimed(uint256 amount);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @param _token - reward token
     * @param _executor - DAO timelock contract
     * @param _merkleRoot - merkle root from rewards tree
     * @param _halvePeriod - period for dividing the reward
     * @param _initialReward - initial user reward
     * @param _claimingPeriod - claiming period
     * @param _canceler - can cancel distribution, and withdraw to _executor.
     *
     */
    constructor(
        FluenceToken _token,
        Executor _executor,
        bytes32 _merkleRoot,
        uint256 _halvePeriod,
        uint256 _lockupPeriod,
        uint256 _initialReward,
        uint256 _claimingPeriod,
        address _canceler,
        uint256 _maxClaimedSupply
    ) {
        token = _token;
        executor = _executor;
        canceler = _canceler;

        merkleRoot = _merkleRoot;
        halvePeriod = _halvePeriod;
        lockupPeriod = _lockupPeriod;
        initialReward = _initialReward;

        deployTime = block.timestamp;
        claimingEndTime = block.timestamp + _claimingPeriod;

        maxClaimedSupply = _maxClaimedSupply;

        decimals = _token.decimals();
    }

    modifier whenClaimingIs(bool isActive) {
        require(isClaimingActive() == isActive, "Claiming status is not as expected");
        _;
    }

    function name() external view returns (string memory) {
        return "Fluence Drop";
    }

    function symbol() external view returns (string memory) {
        return "FLT-DROP";
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return lockedBalances[account].amount;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        require(value > 0, "Value is 0");
        require(lockedBalances[msg.sender].amount == value, "Invalid amount");
        require(block.timestamp > lockedBalances[msg.sender].unlockTime, "Tokens are locked");

        lockedBalances[msg.sender].amount = 0;
        _totalSupply -= value;
        IERC20(token).safeTransfer(msg.sender, value);
        emit Transfer(msg.sender, address(0x00), value);

        return true;
    }

    /**
     * @notice Claim reward token
     * @param userId - user id in merkle tree
     * @param merkleProof - merkle proof for leaf
     * @param temporaryAddress - temporary Ethereum address that's used only for signing
     * @param signature - signature of temporary Ethereum address
     *
     */
    function claimTokens(
        uint32 userId,
        bytes32[] calldata merkleProof,
        address temporaryAddress,
        bytes calldata signature
    ) external whenClaimingIs(true) {
        require(!isClaimed(userId), "Tokens already claimed");
        require(lockedBalances[msg.sender].unlockTime == 0, "Tokens are already locked");

        uint256 amount = currentReward();
        uint256 claimedSupply_ = claimedSupply;

        require(claimedSupply_ + amount <= maxClaimedSupply, "Total claimed exceeded max limit");

        bytes32 leaf = keccak256(abi.encodePacked(userId, temporaryAddress));

        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Valid proof required");

        bytes32 msgHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n20", msg.sender));

        address signer = ECDSA.recover(msgHash, signature);
        require(signer == temporaryAddress, "Invalid signature");

        _setClaimed(userId);

        lockedBalances[msg.sender] = LockedBalance({amount: amount, unlockTime: block.timestamp + lockupPeriod});
        _totalSupply += amount;
        claimedSupply = claimedSupply_ + amount;

        emit Transfer(address(0x00), msg.sender, amount);
        emit Claimed(userId, msg.sender, amount, leaf);
    }

    /**
     * @notice used to move any remaining tokens out of the contract to Executor (DAO) in emergency situation.
     *
     */
    function withdraw() external {
        require(msg.sender == canceler, "Caller is not a canceler");

        IERC20 rewardToken = IERC20(token); //gas saving

        uint256 remainingBalance = rewardToken.balanceOf(address(this));
        rewardToken.safeTransfer(address(executor), remainingBalance);

        emit TransferUnclaimed(remainingBalance);
    }

    /**
     * @notice checks claimed bitMap for userId
     * @dev fork from uniswap merkle distributor, unmodified
     * @return - boolean
     *
     */
    function isClaimed(uint256 index) public view returns (bool) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    /**
     * @notice Checking if claiming is active
     * @return - boolean
     *
     */
    function isClaimingActive() public view returns (bool) {
        return block.timestamp < claimingEndTime;
    }

    /**
     * @notice Get current user's reward
     * @return - boolean
     *
     */
    function currentReward() public view returns (uint256) {
        if (!isClaimingActive()) {
            return 0;
        }

        uint256 halveTimes = (block.timestamp - deployTime) / halvePeriod;
        uint256 denominator = 2 ** halveTimes;

        return initialReward / denominator;
    }

    /**
     * @notice Sets a given user by index to claimed
     * @dev taken from uniswap merkle distributor, unmodified
     *
     */
    function _setClaimed(uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[claimedWordIndex] = claimedBitMap[claimedWordIndex] | (1 << claimedBitIndex);
    }
}
