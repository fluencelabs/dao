// SPDX-License-Identifier: Apache-2.0

pragma solidity >=0.8.15;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./FluenceToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract Vesting is ERC20, ERC20Permit {
    using SafeERC20 for IERC20;

    FluenceToken public immutable token;
    uint256 public immutable startTimestamp;
    uint256 public immutable cliffEndTimestamp;
    uint256 public immutable totalLockedTime;

    mapping(address => uint256) public lockedAmounts;

    /**
     * @notice constructor
     * @param token_ - token address
     * @param name_ - vesting token address
     * @param symbol_ - vesting token address
     * @param _cliffDuration - cliff duration
     * @param _vestingDuration - vesting duration
     * @param accounts - vesting accounts
     * @param amounts - vesting amounts of accounts
     **/
    constructor(
        FluenceToken token_,
        string memory name_,
        string memory symbol_,
        uint256 _cliffDuration,
        uint256 _vestingDuration,
        address[] memory accounts,
        uint256[] memory amounts
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        require(
            accounts.length == amounts.length,
            "accounts and amounts must have the same length"
        );

        startTimestamp = block.timestamp;

        uint256 cliffDuration = _cliffDuration;
        cliffEndTimestamp = block.timestamp + cliffDuration;

        totalLockedTime = _vestingDuration + cliffDuration;

        token = token_;

        for (uint256 i = 0; i < accounts.length; i++) {
            lockedAmounts[accounts[i]] = amounts[i];
            _mint(accounts[i], amounts[i]);
        }
    }

    function release(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function getReleaseAmount(address account) public view returns (uint256) {
        if (block.timestamp <= cliffEndTimestamp) {
            return 0;
        }

        uint256 totalTime = totalLockedTime;
        uint256 locked = lockedAmounts[account];
        uint256 released = locked - balanceOf(account);

        uint256 past = block.timestamp - startTimestamp;

        uint256 amount = 0;
        if (past >= totalTime) {
            amount = locked - released;
        } else {
            uint256 amountBySec = locked / totalTime;
            amount = past * amountBySec - released;
        }

        return amount;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        require(
            from == address(0) || to == address(0),
            "Transfer is not allowed"
        );

        if (to == address(0)) {
            uint256 releaseAmount = getReleaseAmount(from);

            require(
                amount <= releaseAmount && releaseAmount > 0,
                "Not enough release amount"
            );

            IERC20(token).safeTransfer(from, amount);
        }

        super._beforeTokenTransfer(from, to, amount);
    }
}
