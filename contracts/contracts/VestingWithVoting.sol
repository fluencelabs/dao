// SPDX-License-Identifier: Apache-2.0

pragma solidity >=0.8.15;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Vesting.sol";
import "./FluenceToken.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract VestingWithVoting is Vesting, ERC20Votes {
    constructor(
        FluenceToken token_,
        string memory name_,
        string memory symbol_,
        uint256 _cliffDurationMonths,
        uint256 _vestingDurationMonths,
        address[] memory accounts,
        uint256[] memory amounts
    )
        Vesting(
            token_,
            name_,
            symbol_,
            _cliffDurationMonths,
            _vestingDurationMonths,
            accounts,
            amounts
        )
    {}

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(Vesting, ERC20) {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
}
