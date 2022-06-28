pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Vesting.sol";
import "./FluenceToken.sol";

contract VestingWithVoting is Vesting {
    constructor(
        FluenceToken token_,
        uint256 cliffMonthDuration_,
        uint256 vestingMonthDuration_,
        address[] memory accounts,
        uint256[] memory amounts
    )
        Vesting(
            token_,
            cliffMonthDuration_,
            vestingMonthDuration_,
            accounts,
            amounts
        )
    {}

    function getVotes(address account) external view returns (uint256) {
        Info storage info = vestingInfo[account];
        return info.locked - info.released;
    }
}
