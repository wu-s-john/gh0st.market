// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IProofVerifier} from "./interfaces/IProofVerifier.sol";

/// @title ProofVerifier
/// @notice Mock proof verifier for hackathon - always returns true
/// @dev Replace with real vlayer verification in production
contract ProofVerifier is IProofVerifier {
    /// @notice Verify a vlayer zk-TLS proof
    /// @dev MOCK: Always returns true for hackathon
    function verifyProof(
        bytes calldata /* proof */,
        string calldata /* targetDomain */
    ) external pure override returns (bool valid) {
        // TODO: Implement real vlayer proof verification
        // For hackathon, always return true
        return true;
    }
}
