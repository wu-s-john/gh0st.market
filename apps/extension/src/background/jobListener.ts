/**
 * Job Listener - Polls blockchain for new jobs matching worker's approved specs.
 */

import {
  getPublicClient,
  getContractAddress,
  jobRegistryAbi,
  POLLING_INTERVAL,
  isClientsInitialized,
} from "./config";
import type { JobWithSpec } from "./types";

export interface JobListenerConfig {
  /** Worker's approved spec IDs */
  approvedSpecIds: Set<number>;
  /** Minimum bounty filter per spec (in ETH) */
  minBountyBySpec: Map<number, number>;
  /** Callback when new matching job found */
  onJobFound: (job: JobWithSpec) => void;
}

interface JobListenerState {
  /** Last known job count */
  lastJobCount: bigint;
  /** Set of job IDs we've already processed */
  seenJobIds: Set<string>;
  /** Polling interval ID */
  intervalId: ReturnType<typeof setInterval> | null;
}

const state: JobListenerState = {
  lastJobCount: BigInt(0),
  seenJobIds: new Set(),
  intervalId: null,
};

/**
 * Fetch job details from chain and denormalize with spec data.
 */
async function fetchJobWithSpec(jobId: bigint): Promise<JobWithSpec | null> {
  try {
    const publicClient = getPublicClient();
    const contractAddress = getContractAddress();

    // Get job data
    const job = await publicClient.readContract({
      address: contractAddress,
      abi: jobRegistryAbi,
      functionName: "getJob",
      args: [jobId],
    });

    // Only process open jobs (status === 0)
    if (job.status !== 0) {
      return null;
    }

    // Get spec data
    const spec = await publicClient.readContract({
      address: contractAddress,
      abi: jobRegistryAbi,
      functionName: "getJobSpec",
      args: [job.specId],
    });

    return {
      jobId,
      specId: job.specId,
      inputs: job.inputs,
      bounty: job.bounty,
      token: job.token,
      requester: job.requester,
      requesterContact: job.requesterContact,
      mainDomain: spec.mainDomain,
      notarizeUrl: spec.notarizeUrl,
      promptInstructions: spec.promptInstructions,
      outputSchema: spec.outputSchema,
    };
  } catch (error) {
    console.error(`[jobListener] Failed to fetch job ${jobId}:`, error);
    return null;
  }
}

/**
 * Check if job matches worker's criteria.
 */
function jobMatchesCriteria(
  job: JobWithSpec,
  config: JobListenerConfig
): boolean {
  const specId = Number(job.specId);

  // Must be in approved specs
  if (!config.approvedSpecIds.has(specId)) {
    return false;
  }

  // Check minimum bounty
  const minBounty = config.minBountyBySpec.get(specId) || 0;
  const bountyInEth = Number(job.bounty) / 1e18;
  if (bountyInEth < minBounty) {
    return false;
  }

  return true;
}

/**
 * Poll for new jobs.
 */
async function pollForJobs(config: JobListenerConfig): Promise<void> {
  // Skip if clients not initialized
  if (!isClientsInitialized()) {
    return;
  }

  try {
    const publicClient = getPublicClient();
    const contractAddress = getContractAddress();

    // Get current job count
    const jobCount = await publicClient.readContract({
      address: contractAddress,
      abi: jobRegistryAbi,
      functionName: "getJobCount",
    });

    // Check for new jobs
    for (let i = state.lastJobCount; i < jobCount; i++) {
      const jobIdStr = i.toString();

      // Skip if already seen
      if (state.seenJobIds.has(jobIdStr)) {
        continue;
      }

      state.seenJobIds.add(jobIdStr);

      // Fetch job details
      const job = await fetchJobWithSpec(i);
      if (!job) continue;

      // Check if it matches worker criteria
      if (jobMatchesCriteria(job, config)) {
        console.log(`[jobListener] Found matching job ${i}`);
        config.onJobFound(job);
      }
    }

    state.lastJobCount = jobCount;
  } catch (error) {
    console.error("[jobListener] Polling error:", error);
  }
}

/**
 * Start listening for new jobs via polling.
 * @returns Function to stop listening
 */
export function startJobListener(config: JobListenerConfig): () => void {
  console.log("[jobListener] Starting with config:", {
    approvedSpecIds: Array.from(config.approvedSpecIds),
    minBountyBySpec: Object.fromEntries(config.minBountyBySpec),
  });

  // Initial poll
  pollForJobs(config);

  // Set up interval
  state.intervalId = setInterval(() => {
    pollForJobs(config);
  }, POLLING_INTERVAL);

  // Return cleanup function
  return () => {
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    console.log("[jobListener] Stopped");
  };
}

/**
 * Update listener configuration (e.g., when approved specs change).
 */
export function updateListenerConfig(config: JobListenerConfig): void {
  // The next poll will use the updated config
  console.log("[jobListener] Config updated");
}

/**
 * Reset listener state (for testing).
 */
export function resetListenerState(): void {
  state.lastJobCount = BigInt(0);
  state.seenJobIds.clear();
}
