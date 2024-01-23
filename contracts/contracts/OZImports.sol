// SPDX-License-Identifier: Apache-2.0

pragma solidity >=0.8.15;

// This .sol provides allowance to create artifacts of the contracts and
//  typechain types of the contracts we use in hardhat-deployments and, thereafter, in tests.
// Note, hardhat-deployment needs artifacts of the proxy that differs from defaults ones (ERC173Proxy)
//  when use hre.deployments.deploy(..., proxy=<...>).
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
// To use typechains in tests.
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

// TODO: need it for solidity-coverage, but they are not used in code.
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
