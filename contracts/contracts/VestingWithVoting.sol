// SPDX-License-Identifier: Apache-2.0

pragma solidity >=0.8.15;

import "@openzeppelin/contracts/governance/utils/Votes.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Vesting.sol";
import "./FluenceToken.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

contract VestingWithVoting is Vesting, Votes {
    constructor(
        FluenceToken token_,
        string memory name_,
        string memory symbol_,
        uint256 _cliffDuration,
        uint256 _vestingDuration,
        address[] memory accounts,
        uint256[] memory amounts
    )
        Vesting(
            token_,
            name_,
            symbol_,
            _cliffDuration,
            _vestingDuration,
            accounts,
            amounts
        )
        EIP712(name_, "1")
    {
        for (uint256 i = 0; i < accounts.length; i++) {
            address account = accounts[i];
            _transferVotingUnits(address(0x00), account, amounts[i]);
            _delegate(account, account);
        }
    }

    function totalSupply() external view override returns (uint256) {
        return _getTotalSupply();
    }

    function _addTotalSupply(uint256 amount) internal override {}

    function _getVotingUnits(address account)
        internal
        view
        override
        returns (uint256)
    {
        return _balanceOf(account);
    }

    function _beforeBurn(address from, uint256 amount) internal override {
        _transferVotingUnits(from, address(0x00), amount);
    }
}
