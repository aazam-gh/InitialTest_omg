// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title AssessmentToken
/// @notice A fixed-supply ERC-20 assessment artifact. It is independent of the local ChainScope ledger.
contract AssessmentToken is ERC20 {
    /// @param initialSupply Whole tokens to mint to the deployment account.
    constructor(uint256 initialSupply) ERC20("Assessment Token", "AST") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}
