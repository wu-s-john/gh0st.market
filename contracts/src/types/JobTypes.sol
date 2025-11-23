// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @notice Status of a job in the registry
enum JobStatus {
    Open,       // Job posted, waiting for worker
    Completed   // Work submitted and verified, payment sent
}

/// @notice A reusable template that defines what data to fetch and how
struct JobSpec {
    string mainDomain;          // Main domain for categorization (e.g. "crunchbase.com")
    string notarizeUrl;         // URL template with {{placeholders}} (e.g. "https://crunchbase.com/organization/{{orgSlug}}")
    string description;         // Short description for browsing/discovery
    string promptInstructions;  // Detailed instructions for AI/workers on data extraction
    string outputSchema;        // Expected JSON output schema
    string inputSchema;         // JSON schema defining placeholder variable types
    string validationRules;     // Rules for validating the output
    address creator;            // Who created the spec
    uint64 createdAt;
    bool active;                // Whether spec is accepting new jobs
}

/// @notice Parameters for creating a new job spec
struct CreateJobSpecParams {
    string mainDomain;          // Main domain for categorization (e.g. "crunchbase.com")
    string notarizeUrl;         // URL template with {{placeholders}} (e.g. "https://crunchbase.com/organization/{{orgSlug}}")
    string description;         // Short description for browsing/discovery
    string promptInstructions;  // Detailed instructions for AI/workers on data extraction
    string outputSchema;        // Expected JSON output schema
    string inputSchema;         // JSON schema defining placeholder variable types
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
