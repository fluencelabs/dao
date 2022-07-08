// SPDX-License-Identifier: Apache-2.0

pragma solidity >=0.8.15;

import "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./Governor.sol";

contract Executor is TimelockControllerUpgradeable, UUPSUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 minDelay) public initializer {
        __UUPSUpgradeable_init();
        __TimelockController_init(minDelay, new address[](0), new address[](1));
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
