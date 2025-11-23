// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {CreateJobSpecParams, CreateJobParams, JobSpec, Job} from "../types/JobTypes.sol";
import {IProofVerifier} from "./IProofVerifier.sol";

interface IJobRegistry {
    // ============ Events ============

    /// @notice Emitted when a new job spec is created
    event JobSpecCreated(
        uint256 indexed specId,
        address indexed creator,
        string mainDomain
    );

    /// @notice Emitted when a job spec's active status changes
    event JobSpecActiveChanged(
        uint256 indexed specId,
        bool active
    );

    /// @notice Emitted when a new job is created
    event JobCreated(
        uint256 indexed jobId,
        uint256 indexed specId,
        address indexed requester,
        address token,
        uint256 bounty
    );

    /// @notice Emitted when work is submitted and payment is sent
    event WorkSubmitted(
        uint256 indexed jobId,
        address indexed worker,
        string resultPayload,
        uint256 bountyPaid
    );

    // ============ Write Functions ============

    /// @notice Create a new job spec (template)
    /// @param params Job spec creation parameters
    /// @return specId The ID of the created spec
    function createJobSpec(CreateJobSpecParams calldata params) external returns (uint256 specId);

    /// @notice Create a new job with escrowed bounty
    /// @param params Job creation parameters
    /// @return jobId The ID of the created job
    function createJob(CreateJobParams calldata params) external payable returns (uint256 jobId);

    /// @notice Submit work for a job with proof
    /// @param jobId The job to submit work for
    /// @param resultPayload The result data (JSON or encrypted)
    /// @param proof The vlayer zk-TLS proof
    /// @param paymentAddress Address to receive the bounty
    function submitWork(
        uint256 jobId,
        string calldata resultPayload,
        bytes calldata proof,
        address paymentAddress
    ) external;

    /// @notice Set a job spec's active status (only creator can call)
    /// @param specId The spec to update
    /// @param active Whether the spec should accept new jobs
    function setJobSpecActive(uint256 specId, bool active) external;

    // ============ View Functions ============

    /// @notice Get job spec details
    function getJobSpec(uint256 specId) external view returns (JobSpec memory);

    /// @notice Get total number of job specs
    function getJobSpecCount() external view returns (uint256);

    /// @notice Get job details
    function getJob(uint256 jobId) external view returns (Job memory);

    /// @notice Get total number of jobs
    function getJobCount() external view returns (uint256);

    /// @notice Get a range of job specs (for batch fetching)
    /// @param from Start index (inclusive)
    /// @param to End index (exclusive)
    /// @return specs Array of job specs in the range
    function getJobSpecsRange(uint256 from, uint256 to) external view returns (JobSpec[] memory specs);

    /// @notice Get a range of jobs (for batch fetching)
    /// @param from Start index (inclusive)
    /// @param to End index (exclusive)
    /// @return jobs Array of jobs in the range
    function getJobsRange(uint256 from, uint256 to) external view returns (Job[] memory jobs);

    /// @notice Get the proof verifier contract
    function proofVerifier() external view returns (IProofVerifier);
}
