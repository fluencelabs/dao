// SPDX-License-Identifier: Apache-2.0

pragma solidity >=0.8.15;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./FluenceToken.sol";

/**
 * @title Vesting with Delayed Start
 * @notice Vesting Fluence token contract
 * @dev This contract implements the ERC20 standard. It is possible to add the contract to a wallet. Transferring to zero address is unlocking the released amount.
 */
contract Vesting is IERC20 {
    using SafeERC20 for IERC20;

    /**
     * @notice Returns the vesting token
     *
     */
    FluenceToken public immutable token;

    /**
     * @notice Returns the  start vesting time
     *
     */
    uint256 public immutable startTimestamp;

    /**
     * @notice Returns the vesting duration since vesting start
     *
     */
    uint256 public immutable vestingDuration;

    /**
     * @notice Returns the vesting contract decimals
     *
     */
    uint8 public immutable decimals;

    bytes32 private immutable _name;
    uint256 private immutable _nameLength;

    bytes32 private immutable _symbol;
    uint256 private immutable _symbolLength;

    /**
     * @notice Returns the locked vesting user's balance
     *
     */
    mapping(address => uint256) public lockedBalances;

    /**
     * @notice Returns the current vesting user's balance
     *
     */
    mapping(address => uint256) public balanceOf;

    uint256 private _totalSupply;

    /**
     * @notice constructor
     * @param token_ - vesting token address
     * @param name_ - vesting contract name
     * @param symbol_ - vesting contract symbol
     * @param _vestingDelay - delay before vesting start
     * @param _vestingDuration - vesting duration
     * @param accounts - vesting accounts
     * @param amounts - vesting amounts of accounts
     *
     */
    constructor(
        FluenceToken token_,
        string memory name_,
        string memory symbol_,
        uint256 _vestingDelay,
        uint256 _vestingDuration,
        address[] memory accounts,
        uint256[] memory amounts
    ) {
        require(accounts.length == amounts.length, "accounts and amounts must have the same length");

        require(bytes(name_).length <= 31, "invalid name length");
        require(bytes(symbol_).length <= 31, "invalid symbol length");

        startTimestamp = block.timestamp + _vestingDelay;

        vestingDuration = _vestingDuration;

        token = token_;

        _name = bytes32(bytes(name_));
        _nameLength = bytes(name_).length;

        _symbol = bytes32(bytes(symbol_));
        _symbolLength = bytes(symbol_).length;

        decimals = token.decimals();

        for (uint256 i = 0; i < accounts.length; i++) {
            uint256 amount = amounts[i];
            lockedBalances[accounts[i]] = amount;
            balanceOf[accounts[i]] = amount;
            _totalSupply += amount;
            emit Transfer(address(0x00), accounts[i], amount);
        }
    }

    /**
     * @notice Returns vesting contract name
     *
     */
    function name() external view returns (string memory n) {
        n = string(abi.encodePacked(_name));
        uint256 length = _nameLength;
        assembly {
            mstore(n, length)
        }
    }

    /**
     * @notice Returns vesting contract symbol
     *
     */
    function symbol() external view returns (string memory s) {
        s = string(abi.encodePacked(_symbol));
        uint256 length = _symbolLength;
        assembly {
            mstore(s, length)
        }
    }

    /**
     * @notice Get a available amount by user
     * @return available amount
     *
     */
    function getAvailableAmount(address account) public view returns (uint256) {
        if (block.timestamp <= startTimestamp) {
            return 0;
        }

        uint256 totalTime = vestingDuration;
        uint256 locked = lockedBalances[account];
        uint256 released = locked - balanceOf[account];

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

    /**
     * @notice Unsupported operation
     *
     */
    function allowance(address owner, address spender) external view returns (uint256) {
        return 0;
    }

    /**
     * @notice Returns total locked amount
     *
     */
    function totalSupply() external view virtual override returns (uint256) {
        return _totalSupply;
    }

    /**
     * @notice Returns released amount
     * @param to - always address 0x00
     * @param amount - the full released amount or part of it
     *
     */
    function transfer(address to, uint256 amount) external returns (bool) {
        require(to == address(0x00), "Transfer allowed only to the zero address");

        address sender = msg.sender;
        _burn(sender, amount);

        emit Transfer(sender, to, amount);
        return true;
    }

    /**
     * @notice Unsupported operation
     *
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        revert("Unsupported operation");
    }

    /**
     * @notice Unsupported operation
     *
     */
    function approve(address spender, uint256 amount) external returns (bool) {
        revert("Unsupported operation");
    }

    function _burn(address from, uint256 amount) internal {
        uint256 releaseAmount = getAvailableAmount(from);

        require(releaseAmount > 0, "Not enough the release amount");

        if (amount != 0) {
            require(amount <= releaseAmount, "Not enough the release amount");
        } else {
            amount = releaseAmount;
        }

        _beforeBurn(from, amount);

        balanceOf[from] -= amount;
        _totalSupply -= amount;

        IERC20(token).safeTransfer(from, amount);
    }

    function _beforeBurn(address from, uint256 amount) internal virtual {}
}
