// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IProofVerifier {
    /// @notice Verify a vlayer zk-TLS proof
    /// @param proof The proof data from vlayer
    /// @param targetDomain The expected domain the proof should be for
    /// @return valid Whether the proof is valid
    function verifyProof(
        bytes calldata proof,
        string calldata targetDomain
    ) external view returns (bool valid);
}
