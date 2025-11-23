// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IJobRegistry} from "./interfaces/IJobRegistry.sol";
import {IProofVerifier} from "./interfaces/IProofVerifier.sol";
import {CreateJobSpecParams, CreateJobParams, JobSpec, Job, JobStatus} from "./types/JobTypes.sol";

/// @title JobRegistry
/// @notice Registry for job specs and jobs with escrow and proof verification
contract JobRegistry is IJobRegistry, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State ============

    /// @notice The proof verifier contract
    IProofVerifier public immutable override proofVerifier;

    /// @notice Counter for job spec IDs
    uint256 private _nextSpecId;

    /// @notice Counter for job IDs
    uint256 private _nextJobId;

    /// @notice Mapping of spec ID to job spec data
    mapping(uint256 => JobSpec) internal _specs;

    /// @notice Mapping of job ID to job data
    mapping(uint256 => Job) internal _jobs;

    // ============ Errors ============

    error InvalidBounty();
    error InvalidPaymentAddress();
    error InvalidSpec();
    error SpecNotActive();
    error NotSpecCreator();
    error JobNotOpen();
    error InvalidProof();
    error PaymentFailed();
    error TokenMismatch();

    // ============ Constructor ============

    constructor(address _proofVerifier) {
        proofVerifier = IProofVerifier(_proofVerifier);
    }

    // ============ External Functions ============

    /// @inheritdoc IJobRegistry
    function createJobSpec(CreateJobSpecParams calldata params)
        external
        override
        returns (uint256 specId)
    {
        specId = _nextSpecId++;
        _specs[specId] = JobSpec({
            mainDomain: params.mainDomain,
            notarizeUrl: params.notarizeUrl,
            description: params.description,
            promptInstructions: params.promptInstructions,
            outputSchema: params.outputSchema,
            inputSchema: params.inputSchema,
            validationRules: params.validationRules,
            creator: msg.sender,
            createdAt: uint64(block.timestamp),
            active: true
        });

        emit JobSpecCreated(specId, msg.sender, params.mainDomain);
    }

    /// @inheritdoc IJobRegistry
    function setJobSpecActive(uint256 specId, bool active) external override {
        JobSpec storage spec = _specs[specId];
        if (spec.createdAt == 0) revert InvalidSpec();
        if (spec.creator != msg.sender) revert NotSpecCreator();

        spec.active = active;
        emit JobSpecActiveChanged(specId, active);
    }

    /// @inheritdoc IJobRegistry
    function createJob(CreateJobParams calldata params)
        external
        payable
        override
        returns (uint256 jobId)
    {
        if (params.bounty == 0) revert InvalidBounty();

        // Validate spec exists and is active
        JobSpec storage spec = _specs[params.specId];
        if (spec.createdAt == 0) revert InvalidSpec();
        if (!spec.active) revert SpecNotActive();

        // Handle payment
        if (params.token == address(0)) {
            // Native ETH
            if (msg.value != params.bounty) revert InvalidBounty();
        } else {
            // ERC-20
            if (msg.value != 0) revert TokenMismatch();
            IERC20(params.token).safeTransferFrom(msg.sender, address(this), params.bounty);
        }

        // Create job
        jobId = _nextJobId++;
        _jobs[jobId] = Job({
            specId: params.specId,
            inputs: params.inputs,
            requesterContact: params.requesterContact,
            token: params.token,
            bounty: params.bounty,
            requester: msg.sender,
            status: JobStatus.Open,
            createdAt: uint64(block.timestamp),
            completedAt: 0,
            resultPayload: "",
            worker: address(0)
        });

        emit JobCreated(
            jobId,
            params.specId,
            msg.sender,
            params.token,
            params.bounty
        );
    }

    /// @inheritdoc IJobRegistry
    function submitWork(
        uint256 jobId,
        string calldata resultPayload,
        bytes calldata proof,
        address paymentAddress
    ) external override nonReentrant {
        if (paymentAddress == address(0)) revert InvalidPaymentAddress();

        Job storage job = _jobs[jobId];
        if (job.status != JobStatus.Open) revert JobNotOpen();

        // Get the spec's main domain for proof verification
        JobSpec storage spec = _specs[job.specId];

        // Verify proof against the spec's main domain
        if (!proofVerifier.verifyProof(proof, spec.mainDomain)) {
            revert InvalidProof();
        }

        // Update job state
        job.status = JobStatus.Completed;
        job.completedAt = uint64(block.timestamp);
        job.resultPayload = resultPayload;
        job.worker = paymentAddress;

        // Pay worker
        uint256 bounty = job.bounty;
        if (job.token == address(0)) {
            // Native ETH
            (bool success, ) = paymentAddress.call{value: bounty}("");
            if (!success) revert PaymentFailed();
        } else {
            // ERC-20
            IERC20(job.token).safeTransfer(paymentAddress, bounty);
        }

        emit WorkSubmitted(jobId, paymentAddress, resultPayload, bounty);
    }

    // ============ View Functions ============

    /// @inheritdoc IJobRegistry
    function getJobSpec(uint256 specId) external view override returns (JobSpec memory) {
        return _specs[specId];
    }

    /// @inheritdoc IJobRegistry
    function getJobSpecCount() external view override returns (uint256) {
        return _nextSpecId;
    }

    /// @inheritdoc IJobRegistry
    function getJob(uint256 jobId) external view override returns (Job memory) {
        return _jobs[jobId];
    }

    /// @inheritdoc IJobRegistry
    function getJobCount() external view override returns (uint256) {
        return _nextJobId;
    }
}
