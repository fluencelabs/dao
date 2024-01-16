// SPDX-License-Identifier: Apache-2.0

pragma solidity >=0.8.15;

import "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./Governor.sol";

/**
 * @title Executor
 * @notice DAO timelock contract. This contract is called Executor because all successful DAO proposals results flow through it.
 */
contract Executor is TimelockControllerUpgradeable, UUPSUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Constructor for this updatable contract
     * @param minDelay - minimal delay time for timelock
     **/
    function initialize(uint256 minDelay) public initializer {
        __UUPSUpgradeable_init();
        __TimelockController_init(
            minDelay,
            new address[](0),
            new address[](1),
            msg.sender
        );
    }

    function _authorizeUpgrade(
        address /*newImplementation*/
    ) internal view override {
        require(
            msg.sender == address(this),
            "Only this contract can authorize an upgrade"
        );
    }
}
