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

    /**
     * @notice Reward token
     **/
    FluenceToken public immutable token;

    /**
     * @notice DAO timelock contract address
     **/
    Executor public immutable executor;

    /**
     * @notice Claiming end time
     **/
    uint256 public immutable claimingEndTime;

    /**
     * @notice Time when this contract was deployed
     **/
    uint256 public immutable deployTime;

    /**
     * @notice Merkle root from rewards tree
     **/
    bytes32 public immutable merkleRoot;

    /**
     * @notice Period for dividing the reward
     **/
    uint256 public immutable halvePeriod;

    /**
     * @notice Initial user's reward
     **/
    uint256 public immutable initialReward;

    /**
     * @notice Bitmap with claimed users ids
     **/
    mapping(uint256 => uint256) private claimedBitMap;

    /**
     * @notice Emitted when user claims reward
     * @param userId - reward user id
     * @param account - reward account
     * @param amount - reward amount
     * @param leaf - leaf with user's info in reward tree
     **/
    event Claimed(
        uint256 userId,
        address account,
        uint256 amount,
        bytes32 leaf
    );

    /**
     * @notice Emitted when claiming period is ended and tokens transfer to the executor
     * @param amount - remainder balance
     **/
    event TransferUnclaimed(uint256 amount);

    /**
     * @param _token - reward token
     * @param _executor - DAO timelock contract
     * @param _merkleRoot - merkle root from rewards tree
     * @param _halvePeriod - period for dividing the reward
     * @param _initialReward - initial user reward
     * @param _claimingPeriod - claiming period
     **/
    constructor(
        FluenceToken _token,
        Executor _executor,
        bytes32 _merkleRoot,
        uint256 _halvePeriod,
        uint256 _initialReward,
        uint256 _claimingPeriod
    ) {
        token = _token;
        executor = _executor;

        merkleRoot = _merkleRoot;
        halvePeriod = _halvePeriod;
        initialReward = _initialReward;

        deployTime = block.timestamp;
        claimingEndTime = block.timestamp + _claimingPeriod;
    }

    modifier whenClaimingIs(bool isActive) {
        require(
            isClaimingActive() == isActive,
            "Claiming status is not as expected"
        );
        _;
    }

    /**
     * @notice Claim reward token
     * @param userId - user id in merkle tree
     * @param merkleProof - merkle proof for leaf
     * @param temporaryAddress - temporary Ethereum address that's used only for signing
     * @param signature - signature of temporary Ethereum address
     **/
    function claimTokens(
        uint32 userId,
        bytes32[] calldata merkleProof,
        address temporaryAddress,
        bytes calldata signature
    ) external whenClaimingIs(true) {
        require(!isClaimed(userId), "Tokens already claimed");

        bytes32 leaf = keccak256(abi.encode(userId, temporaryAddress));

        require(
            MerkleProof.verify(merkleProof, merkleRoot, leaf),
            "Valid proof required"
        );

        bytes32 msgHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n20", msg.sender)
        );

        address signer = ECDSA.recover(msgHash, signature);
        require(signer == temporaryAddress, "Invalid signature");

        _setClaimed(userId);

        uint256 amount = currentReward();

        IERC20(token).safeTransfer(msg.sender, amount);

        emit Claimed(userId, msg.sender, amount, leaf);
    }

    /**
     * @notice used to move any remaining tokens out of the contract after expiration
     **/
    function transferUnclaimed() external whenClaimingIs(false) {
        IERC20 rewardToken = IERC20(token); //gas saving

        uint256 remainingBalance = rewardToken.balanceOf(address(this));
        rewardToken.safeTransfer(address(executor), remainingBalance);

        emit TransferUnclaimed(remainingBalance);
    }

    /**
     * @notice checks claimed bitMap for userId
     * @dev fork from uniswap merkle distributor, unmodified
     * @return - boolean
     **/
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
     **/
    function isClaimingActive() public view returns (bool) {
        return block.timestamp < claimingEndTime;
    }

    /**
     * @notice Get current user's reward
     * @return - boolean
     **/
    function currentReward() public view returns (uint256) {
        if (!isClaimingActive()) {
            return 0;
        }

        uint256 halveTimes = (block.timestamp - deployTime) / halvePeriod;
        uint256 denominator = 2**halveTimes;

        return initialReward / denominator;
    }

    /**
     * @notice Sets a given user by index to claimed
     * @dev taken from uniswap merkle distributor, unmodified
     **/
    function _setClaimed(uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[claimedWordIndex] =
            claimedBitMap[claimedWordIndex] |
            (1 << claimedBitIndex);
    }
}
