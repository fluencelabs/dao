pragma solidity ^0.8.15;

import "./FluenceToken.sol";
import "./Executor.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract DevRewardDistributor {
    using SafeERC20 for IERC20;

    FluenceToken public immutable token;
    Executor public immutable executor;

    uint256 public immutable deployTime;
    bytes32 public immutable merkleRoot;

    // Reward will be halved every halvePeriod
    uint256 public immutable halvePeriod;
    // Initial reward is Ne18, i.e., N tokens.
    uint256 public immutable initialReward;
    // How long will this contract process token claims
    uint256 public immutable claimingPeriod;

    // This is a packed array of booleans.
    mapping(uint256 => uint256) private claimedBitMap;

    // This event is triggered when a call to ClaimTokens succeeds.
    event Claimed(
        uint256 userId,
        address account,
        uint256 amount,
        bytes32 leaf
    );

    // This event is triggered when unclaimed drops are moved to Timelock after contractActive period
    event TransferUnclaimed(uint256 amount);

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
        claimingPeriod = _claimingPeriod;

        deployTime = block.timestamp;
    }

    modifier whenClaimingIs(bool isActive) {
        require(
            isClaimingActive() == isActive,
            "DevRewardDistributor: Claiming status not as expected."
        );
        _;
    }

    /**
     * @notice process incoming token claims, must be signed by <signer>
     * @param userId - serves as nonce - only one claim per user_id
     * @param merkleProof - proof hashes for leaf
     * @param temporaryAddress - temporary Ethereum address that's used only for signing
     * @param signature - signature of temporary Ethereum address
     **/
    function claimTokens(
        uint32 userId,
        bytes32[] calldata merkleProof,
        address temporaryAddress,
        bytes calldata signature
    ) external whenClaimingIs(true) {
        // one claim per user
        require(
            !isClaimed(userId),
            "DevRewardDistributor: Tokens already claimed."
        );

        bytes32 leaf = keccak256(abi.encode(userId, temporaryAddress));

        require(
            MerkleProof.verify(merkleProof, merkleRoot, leaf),
            "DevRewardDistributor: Valid Proof Required."
        );

        bytes32 msgHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n20", msg.sender)
        );

        address signer = ECDSA.recover(msgHash, signature);
        require(
            signer == temporaryAddress,
            "DevRewardDistributor: Valid msg.sender Signature required."
        );

        _setClaimed(userId);

        uint256 amount = currentReward();

        IERC20(token).safeTransfer(msg.sender, amount);

        emit Claimed(userId, msg.sender, amount, leaf);
    }

    /**
     * @notice used to move any remaining tokens out of the contract after expiration
     **/
    function transferUnclaimed() public whenClaimingIs(false) {
        uint256 remainingBalance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(address(executor), remainingBalance);

        emit TransferUnclaimed(remainingBalance);
    }

    /**
     * @notice checks claimedBitMap to see if if user_id is 0/1
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
     * Returns true if this contract is active, false otherwise
     */
    function isClaimingActive() public view returns (bool) {
        return block.timestamp < (deployTime + claimingPeriod);
    }

    /**
     * Returns current size of the reward in tokens
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
     * @notice Sets a given user_id to claimed
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
