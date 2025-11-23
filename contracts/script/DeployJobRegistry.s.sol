// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console2} from "forge-std/Script.sol";
import {JobRegistry} from "../src/JobRegistry.sol";
import {ProofVerifier} from "../src/ProofVerifier.sol";

/// @title DeployJobRegistry
/// @notice Deployment script for JobRegistry and ProofVerifier
contract DeployJobRegistry is Script {
    function run() external returns (JobRegistry registry, ProofVerifier verifier) {
        uint256 deployerPrivateKey = vm.envUint("LOCAL_ETH_PRIVATE_KEY1");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy ProofVerifier first
        verifier = new ProofVerifier();
        console2.log("ProofVerifier deployed at:", address(verifier));

        // Deploy JobRegistry with ProofVerifier address
        registry = new JobRegistry(address(verifier));
        console2.log("JobRegistry deployed at:", address(registry));

        vm.stopBroadcast();

        return (registry, verifier);
    }
}
