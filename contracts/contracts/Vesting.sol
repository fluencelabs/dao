// SPDX-License-Identifier: Apache-2.0

pragma solidity >=0.8.15;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./FluenceToken.sol";

contract Vesting is IERC20, IERC20Metadata {
    using SafeERC20 for IERC20;

    FluenceToken public immutable token;
    uint256 public immutable startTimestamp;
    uint256 public immutable cliffEndTimestamp;
    uint256 public immutable totalLockedTime;

    uint8 private immutable _decimals;

    mapping(address => uint256) public lockedAmounts;
    mapping(address => uint256) public currentAmounts;

    string private _name;
    string private _symbol;
    uint256 private _totalSupply;

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
    ) {
        require(
            accounts.length == amounts.length,
            "accounts and amounts must have the same length"
        );

        startTimestamp = block.timestamp;

        uint256 cliffDuration = _cliffDuration;
        cliffEndTimestamp = block.timestamp + cliffDuration;

        totalLockedTime = _vestingDuration + cliffDuration;

        token = token_;
        _name = name_;
        _symbol = symbol_;
        _decimals = token.decimals();

        for (uint256 i = 0; i < accounts.length; i++) {
            uint256 amount = amounts[i];
            lockedAmounts[accounts[i]] = amount;
            currentAmounts[accounts[i]] = amount;
            _addTotalSupply(amount);
        }
    }

    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }

    function totalSupply() external view virtual returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balanceOf(account);
    }

    function getReleaseAmount(address account) public view returns (uint256) {
        if (block.timestamp <= cliffEndTimestamp) {
            return 0;
        }

        uint256 totalTime = totalLockedTime;
        uint256 locked = lockedAmounts[account];
        uint256 released = locked - currentAmounts[account];

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

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(from == msg.sender, "Permission denied");
        _transfer(from, to, amount);

        return true;
    }

    function allowance(
        address, /*owner*/
        address /*spender*/
    ) external pure returns (uint256) {
        revert("Method unsupported");
    }

    function approve(
        address, /*spender*/
        uint256 /*amount*/
    ) external pure returns (bool) {
        revert("Method unsupported");
    }

    function _addTotalSupply(uint256 amount) internal virtual {
        _totalSupply += amount;
    }

    function _balanceOf(address account) internal view returns (uint256) {
        return currentAmounts[account];
    }

    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        require(to == address(0x00), "Transfer allowed only to zero address");

        _burn(from, amount);

        emit Transfer(from, to, amount);
        return true;
    }

    function _burn(address from, uint256 amount) internal {
        uint256 releaseAmount = getReleaseAmount(from);

        require(releaseAmount > 0, "Not enough release amount");

        if (amount != 0) {
            if (amount > releaseAmount) {
                revert("Not enough release amount");
            }
        } else {
            amount = releaseAmount;
        }

        _beforeBurn(from, amount);

        IERC20(token).safeTransfer(from, amount);

        currentAmounts[from] -= amount;
    }

    function _beforeBurn(address from, uint256 amount) internal virtual {}
}
