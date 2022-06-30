// SPDX-License-Identifier: Apache-2.0

pragma solidity >=0.8.15;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./FluenceToken.sol";

contract Vesting {
    using SafeERC20 for IERC20;

    event TokenReleased(
        address indexed account,
        address indexed token,
        uint256 amount
    );

    struct Info {
        uint256 locked;
        uint256 released;
    }

    FluenceToken public immutable token;
    uint256 public immutable startTimestamp;
    uint256 public immutable cliffDurationMonths;
    uint256 public immutable vestingDurationMonths;

    mapping(address => Info) public vestingInfo;

    /**
     * @notice constructor
     * @param token_ - token address
     * @param _cliffDurationMonths - cliff duration
     * @param _vestingDurationMonths - vesting duration
     * @param accounts - vesting accounts
     * @param amounts - vesting amounts of accounts
     **/
    constructor(
        FluenceToken token_,
        uint256 _cliffDurationMonths,
        uint256 _vestingDurationMonths,
        address[] memory accounts,
        uint256[] memory amounts
    ) {
        startTimestamp = uint64(block.timestamp);

        token = token_;
        cliffDurationMonths = _cliffDurationMonths;
        vestingDurationMonths = _vestingDurationMonths;

        require(
            accounts.length == amounts.length,
            "accounts and amounts must have the same length"
        );
        for (uint256 i = 0; i < accounts.length; i++) {
            vestingInfo[accounts[i]] = Info({locked: amounts[i], released: 0});
        }
    }

    function release() external {
        address sender = msg.sender;

        require(
            block.timestamp > startTimestamp + (cliffDurationMonths * 30 days),
            "Cliff period has not ended yet."
        );

        Info storage info = vestingInfo[sender];

        uint256 releaseAmount = 0;
        uint256 totalMonths = (vestingDurationMonths + cliffDurationMonths);
        uint256 past = (block.timestamp - startTimestamp);

        if (past >= totalMonths) {
            releaseAmount = info.locked - info.released;
        } else {
            uint256 amountByMonth = info.locked / totalMonths;

            releaseAmount = pastMonths * amountByMonth - info.released;
        }

        require(releaseAmount > 0, "Not enough release amount.");

        info.released += releaseAmount;
        IERC20(token).safeTransfer(sender, releaseAmount);
    }
}
