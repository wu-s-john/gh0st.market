# gh0st.market Job Registry Smart Contract Design

This document outlines the smart contract design for the gh0st.market job registry in two phases:
- **Phase 1**: Simple escrow-based job registry (no privacy layer)
- **Phase 2**: RAILGUN integration for private payments

---

## Overview

The job registry uses a two-level hierarchy:

1. **JobSpec** — A reusable template that defines *what* data to fetch and *how*:
   - Target domain/endpoint
   - Instructions for replication
   - Expected output schema (JSON)
   - Input parameters schema

2. **Job** — A specific funded instance of a JobSpec:
   - References a `specId`
   - Provides concrete inputs
   - Has bounty amount + token
   - Gets `resultPayload` on completion

The registry allows:
1. **Requestors** to create JobSpecs and post Jobs with bounties
2. **Workers** to browse JobSpecs, pick up Jobs, and submit results with zk-TLS proofs (vlayer)
3. **Automatic payment** when proof is verified

---

## Example: Crunchbase Company Profiles

### 1. Create a JobSpec (once, reusable)

```json
{
  "targetDomain": "crunchbase.com",
  "instructions": "Navigate to the company profile page at crunchbase.com/organization/{slug}. Extract the company info from the page.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "slug": { "type": "string", "description": "Company slug from Crunchbase URL" }
    },
    "required": ["slug"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "description": { "type": "string" },
      "foundedYear": { "type": "number" },
      "totalFunding": { "type": "string" },
      "employeeCount": { "type": "string" },
      "headquarters": { "type": "string" }
    }
  },
  "validationRules": {
    "required": ["name"],
    "rules": [
      { "field": "name", "type": "non_empty_string" },
      { "field": "foundedYear", "type": "range", "min": 1800, "max": 2025 },
      { "field": "totalFunding", "type": "regex", "pattern": "^\\$[0-9]+(\\.[0-9]+)?[BMK]?$" }
    ]
  }
}
```

### 2. Create Jobs (multiple, funded)

```json
// Job 1: Fetch Anthropic profile
{
  "specId": 0,
  "inputs": { "slug": "anthropic" },
  "bounty": "5000000",  // 5 USDC
  "token": "0xA0b8...USDC"
}

// Job 2: Fetch OpenAI profile
{
  "specId": 0,
  "inputs": { "slug": "openai" },
  "bounty": "5000000",
  "token": "0xA0b8...USDC"
}
```

### 3. Worker completes Job 1

- Worker's AI agent navigates to `crunchbase.com/organization/anthropic`
- vlayer generates zk-TLS proof that response came from `crunchbase.com`
- Worker submits proof + encrypted result payload
- Contract verifies proof, releases 5 USDC bounty

---

# Phase 1: Simple Job Registry

A minimal, working contract without RAILGUN. Workers get paid directly to an EOA.

## File Structure

```
contracts/src/
├── types/
│   └── JobTypes.sol          # JobSpec, Job, CreateJobSpecParams, CreateJobParams
├── interfaces/
│   ├── IJobRegistry.sol      # Interface for job specs and jobs
│   └── IProofVerifier.sol    # Interface for vlayer proof verification
├── JobRegistry.sol           # Main registry implementation
└── ProofVerifier.sol         # Mock for hackathon (always returns true)
```

---

## Types (`types/JobTypes.sol`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @notice Status of a job in the registry
enum JobStatus {
    Open,       // Job posted, waiting for worker
    Completed   // Work submitted and verified, payment sent
}

/// @notice A reusable template that defines what data to fetch and how
struct JobSpec {
    string targetDomain;        // Target domain (e.g. "crunchbase.com")
    string instructions;        // Human/AI readable instructions for fetching data
    string outputSchema;        // Expected JSON output schema
    string inputSchema;         // JSON schema for required inputs
    string validationRules;     // Rules for validating the output (e.g. JSON schema, regex, custom logic)
    address creator;            // Who created the spec
    uint64 createdAt;
    bool active;                // Whether spec is accepting new jobs
}

/// @notice Parameters for creating a new job spec
struct CreateJobSpecParams {
    string targetDomain;        // Target domain (e.g. "crunchbase.com")
    string instructions;        // Instructions for fetching data
    string outputSchema;        // Expected JSON output schema
    string inputSchema;         // JSON schema for required inputs
    string validationRules;     // Rules for validating the output
}

/// @notice Parameters for creating a new job
struct CreateJobParams {
    uint256 specId;             // Reference to the JobSpec
    string inputs;              // Concrete inputs as JSON (must match spec's inputSchema)
    address token;              // ERC-20 token for bounty (address(0) = native ETH)
    uint256 bounty;             // Bounty amount
    string requesterContact;    // Optional: 0zk address or other contact info
}

/// @notice A funded job instance referencing a JobSpec
struct Job {
    // Reference to spec
    uint256 specId;             // Which JobSpec this job uses

    // Job-specific inputs
    string inputs;              // Concrete inputs as JSON
    string requesterContact;    // Requestor's contact (0zk address or empty)

    // Payment info
    address token;              // ERC-20 or address(0) for ETH
    uint256 bounty;             // Bounty amount
    address requester;          // Who posted the job (for refunds if needed later)

    // Status
    JobStatus status;
    uint64 createdAt;
    uint64 completedAt;

    // Result (filled on completion)
    string resultPayload;       // JSON or encrypted JSON result
    address worker;             // Worker who completed the job
}
```

---

## Interface (`interfaces/IJobRegistry.sol`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {CreateJobSpecParams, CreateJobParams, JobSpec, Job} from "../types/JobTypes.sol";

interface IJobRegistry {
    // ============ Events ============

    /// @notice Emitted when a new job spec is created
    event JobSpecCreated(
        uint256 indexed specId,
        address indexed creator,
        string targetDomain
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

    /// @notice Emitted when a job spec's active status changes
    event JobSpecActiveChanged(
        uint256 indexed specId,
        bool active
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

    /// @notice Get the proof verifier contract
    function proofVerifier() external view returns (address);
}
```

---

## Proof Verifier Interface (`interfaces/IProofVerifier.sol`)

```solidity
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
```

---

## Mock Proof Verifier (`ProofVerifier.sol`)

```solidity
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
```

---

## Job Registry Implementation (`JobRegistry.sol`)

```solidity
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
            targetDomain: params.targetDomain,
            instructions: params.instructions,
            outputSchema: params.outputSchema,
            inputSchema: params.inputSchema,
            validationRules: params.validationRules,
            creator: msg.sender,
            createdAt: uint64(block.timestamp),
            active: true
        });

        emit JobSpecCreated(specId, msg.sender, params.targetDomain);
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

        // Get the spec's target domain for proof verification
        JobSpec storage spec = _specs[job.specId];

        // Verify proof against the spec's target domain
        if (!proofVerifier.verifyProof(proof, spec.targetDomain)) {
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
```

---

# Phase 2: RAILGUN Integration

Extend the contract to shield bounties into RAILGUN privacy pool on completion.

## Changes Overview

1. Add RAILGUN shield interface
2. Extend `submitWork()` to accept `ShieldRequest` params
3. Contract calls RAILGUN's `shield()` instead of direct transfer
4. New `BountyShielded` event for indexing

---

## Additional Types (extend `types/JobTypes.sol`)

```solidity
// ============ RAILGUN Types ============

/// @notice Token types supported by RAILGUN
enum TokenType {
    ERC20,
    ERC721,
    ERC1155
}

/// @notice Token data for RAILGUN shield
struct TokenData {
    TokenType tokenType;
    address tokenAddress;
    uint256 tokenSubID;  // 0 for ERC20
}

/// @notice Commitment preimage for RAILGUN note
struct CommitmentPreimage {
    uint256 npk;         // Note public key (derived from 0zk address)
    TokenData token;
    uint120 value;
}

/// @notice Encrypted note data
struct ShieldCiphertext {
    bytes32[4] encryptedBundle;
    bytes32 shieldKey;
}

/// @notice RAILGUN shield request (computed off-chain by SDK)
struct ShieldRequest {
    CommitmentPreimage preimage;
    ShieldCiphertext ciphertext;
}

/// @notice Extended params for submitting work with RAILGUN
struct SubmitWorkParams {
    uint256 jobId;
    string resultPayload;
    bytes proof;
    string worker0zkAddress;      // Worker's 0zk address for logging
    ShieldRequest shieldRequest;  // Pre-computed by relayer/SDK
}
```

---

## RAILGUN Interface (`interfaces/IRailgunShield.sol`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ShieldRequest} from "../types/JobTypes.sol";

/// @notice Interface for RAILGUN proxy shield function
interface IRailgunShield {
    /// @notice Shield tokens into RAILGUN privacy pool
    /// @param requests Array of shield requests
    function shield(ShieldRequest[] calldata requests) external;
}
```

---

## Extended Interface (`interfaces/IJobRegistryV2.sol`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IJobRegistry} from "./IJobRegistry.sol";
import {SubmitWorkParams} from "../types/JobTypes.sol";

interface IJobRegistryV2 is IJobRegistry {
    // ============ Additional Events ============

    /// @notice Emitted when bounty is shielded into RAILGUN
    event BountyShielded(
        uint256 indexed jobId,
        string worker0zkAddress,
        address token,
        uint256 amount
    );

    // ============ Additional Functions ============

    /// @notice Submit work with RAILGUN shield (bounty goes to privacy pool)
    /// @param params Submission parameters including shield request
    function submitWorkShielded(SubmitWorkParams calldata params) external;

    /// @notice Get the RAILGUN proxy contract address
    function railgunProxy() external view returns (address);
}
```

---

## Extended Implementation (`JobRegistryV2.sol`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {JobRegistry} from "./JobRegistry.sol";
import {IJobRegistryV2} from "./interfaces/IJobRegistryV2.sol";
import {IRailgunShield} from "./interfaces/IRailgunShield.sol";
import {SubmitWorkParams, ShieldRequest, Job, JobStatus} from "./types/JobTypes.sol";

/// @title JobRegistryV2
/// @notice Job registry with RAILGUN privacy pool integration
contract JobRegistryV2 is JobRegistry, IJobRegistryV2 {
    using SafeERC20 for IERC20;

    // ============ State ============

    /// @notice RAILGUN proxy contract for shielding
    IRailgunShield public immutable override railgunProxy;

    // ============ Constructor ============

    constructor(
        address _proofVerifier,
        address _railgunProxy
    ) JobRegistry(_proofVerifier) {
        railgunProxy = IRailgunShield(_railgunProxy);
    }

    // ============ External Functions ============

    /// @inheritdoc IJobRegistryV2
    function submitWorkShielded(SubmitWorkParams calldata params)
        external
        override
        nonReentrant
    {
        Job storage job = _jobs[params.jobId];
        if (job.status != JobStatus.Open) revert JobNotOpen();

        // Get the spec's target domain for proof verification
        JobSpec storage spec = _specs[job.specId];

        // Verify proof against the spec's target domain
        if (!proofVerifier.verifyProof(params.proof, spec.targetDomain)) {
            revert InvalidProof();
        }

        // Update job state
        job.status = JobStatus.Completed;
        job.completedAt = uint64(block.timestamp);
        job.resultPayload = params.resultPayload;
        job.worker = address(0); // No EOA worker address in shielded mode

        // Approve and shield bounty
        uint256 bounty = job.bounty;
        address token = job.token;

        if (token == address(0)) {
            // For ETH, need to wrap to WETH first (or use RAILGUN's native ETH shield)
            // This is simplified - real implementation would handle ETH properly
            revert("ETH shielding not implemented - use ERC20");
        }

        // Approve RAILGUN proxy
        IERC20(token).safeIncreaseAllowance(address(railgunProxy), bounty);

        // Create shield request array
        ShieldRequest[] memory requests = new ShieldRequest[](1);
        requests[0] = params.shieldRequest;

        // Shield into RAILGUN
        railgunProxy.shield(requests);

        emit BountyShielded(
            params.jobId,
            params.worker0zkAddress,
            token,
            bounty
        );
    }
}
```

---

## Deployment Notes

### Phase 1 Deployment (Sepolia)

```bash
# Deploy mock proof verifier
forge create src/ProofVerifier.sol:ProofVerifier --rpc-url $SEPOLIA_RPC

# Deploy job registry
forge create src/JobRegistry.sol:JobRegistry \
  --rpc-url $SEPOLIA_RPC \
  --constructor-args $PROOF_VERIFIER_ADDRESS
```

### Phase 2 Deployment (with RAILGUN)

```bash
# Find RAILGUN proxy address on Sepolia from:
# https://github.com/Railgun-Community/deployments

# Deploy JobRegistryV2
forge create src/JobRegistryV2.sol:JobRegistryV2 \
  --rpc-url $SEPOLIA_RPC \
  --constructor-args $PROOF_VERIFIER_ADDRESS $RAILGUN_PROXY_ADDRESS
```

---

## Usage Flow

### Phase 1 (Simple)

```
1. Anyone: createJobSpec(targetDomain, instructions, outputSchema, inputSchema)
   → Creates a reusable template for a family of jobs

2. Requestor: createJob(specId, inputs, bounty) + sends ETH/ERC20
   → Creates a funded job instance referencing the spec

3. Worker: Browses available specs, picks up a job
   → Fetches data following the spec's instructions
   → Generates vlayer zk-TLS proof

4. Worker: submitWork(jobId, result, proof, paymentAddress)
   → Contract verifies proof against spec's targetDomain
   → Pays worker directly
```

### Phase 2 (RAILGUN)

```
1. Anyone: createJobSpec(targetDomain, instructions, outputSchema, inputSchema)
   → Creates a reusable template

2. Requestor: createJob(specId, inputs, bounty) + sends ERC20
   → Creates a funded job instance

3. Worker: Picks up job, fetches data, generates vlayer proof

4. Worker/Relayer: Computes ShieldRequest using RAILGUN SDK

5. Relayer: submitWorkShielded(params) - msg.sender is relayer
   → Contract verifies proof, shields bounty to worker's 0zk address

6. Worker: Unshields from RAILGUN whenever they want
```

---

## File Checklist

### Phase 1
- [ ] `contracts/src/types/JobTypes.sol` — JobSpec, Job, CreateJobSpecParams, CreateJobParams, JobStatus
- [ ] `contracts/src/interfaces/IJobRegistry.sol` — Interface with spec + job methods
- [ ] `contracts/src/interfaces/IProofVerifier.sol` — vlayer proof verification interface
- [ ] `contracts/src/ProofVerifier.sol` — Mock verifier (always returns true)
- [ ] `contracts/src/JobRegistry.sol` — Main registry with JobSpec + Job support
- [ ] `contracts/test/JobRegistry.t.sol` — Tests for spec creation, job creation, work submission
- [ ] `contracts/script/DeployJobRegistry.s.sol` — Deployment script

### Phase 2 (extends Phase 1)
- [ ] Extend `contracts/src/types/JobTypes.sol` with RAILGUN types
- [ ] `contracts/src/interfaces/IRailgunShield.sol`
- [ ] `contracts/src/interfaces/IJobRegistryV2.sol`
- [ ] `contracts/src/JobRegistryV2.sol`
- [ ] `contracts/test/JobRegistryV2.t.sol`

---

## References

- [RAILGUN Docs - Shielding](https://docs.railgun.org/developer-guide/wallet/transactions/shielding)
- [RAILGUN Contract Repo](https://github.com/Railgun-Privacy/contract)
- [RAILGUN Deployments](https://github.com/Railgun-Community/deployments)
- [vlayer Web Prover](https://docs.vlayer.xyz)
