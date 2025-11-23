"use client";

import { useReadContract, usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { parseAbiItem, type PublicClient } from "viem";
import { jobRegistryAbi } from "@/generated";
import {
  JOB_REGISTRY_ADDRESS,
  DEPLOYMENT_BLOCK,
  jobRegistryConfig,
} from "@/lib/contracts";
import { getActiveChain } from "@/lib/chains";

// Types matching contract structs
export interface JobSpec {
  mainDomain: string;
  notarizeUrl: string;
  description: string;
  promptInstructions: string;
  outputSchema: string;
  inputSchema: string;
  validationRules: string;
  creator: `0x${string}`;
  createdAt: bigint;
  active: boolean;
}

export interface Job {
  specId: bigint;
  inputs: string;
  requesterContact: string;
  token: `0x${string}`;
  bounty: bigint;
  requester: `0x${string}`;
  status: number; // 0 = Open, 1 = Completed
  createdAt: bigint;
  completedAt: bigint;
  resultPayload: string;
  worker: `0x${string}`;
}

// Extended types with ID for UI
export interface JobSpecWithId extends JobSpec {
  id: bigint;
}

export interface JobWithId extends Job {
  id: bigint;
}

// Event types
const JobSpecCreatedEvent = parseAbiItem(
  "event JobSpecCreated(uint256 indexed specId, address indexed creator, string mainDomain)"
);

const JobCreatedEvent = parseAbiItem(
  "event JobCreated(uint256 indexed jobId, uint256 indexed specId, address indexed requester, address token, uint256 bounty)"
);

/**
 * Fetch a single job spec by ID
 */
export function useJobSpec(specId: bigint | undefined) {
  return useReadContract({
    ...jobRegistryConfig,
    functionName: "getJobSpec",
    args: specId !== undefined ? [specId] : undefined,
    query: {
      enabled: specId !== undefined,
    },
  });
}

/**
 * Fetch a single job by ID
 */
export function useJob(jobId: bigint | undefined) {
  return useReadContract({
    ...jobRegistryConfig,
    functionName: "getJob",
    args: jobId !== undefined ? [jobId] : undefined,
    query: {
      enabled: jobId !== undefined,
    },
  });
}

/**
 * Fetch total job spec count
 */
export function useJobSpecCount() {
  return useReadContract({
    ...jobRegistryConfig,
    functionName: "getJobSpecCount",
  });
}

/**
 * Fetch total job count
 */
export function useJobCount() {
  return useReadContract({
    ...jobRegistryConfig,
    functionName: "getJobCount",
  });
}

/**
 * Fetch all job specs created by a specific address using event logs
 */
export function useUserJobSpecs(userAddress: `0x${string}` | undefined) {
  const chain = getActiveChain();
  const publicClient = usePublicClient({ chainId: chain.id });

  return useQuery({
    queryKey: ["userJobSpecs", userAddress, chain.id],
    queryFn: async () => {
      if (!userAddress || !publicClient) return [];

      // Fetch JobSpecCreated events filtered by creator
      const logs = await publicClient.getLogs({
        address: JOB_REGISTRY_ADDRESS,
        event: JobSpecCreatedEvent,
        args: { creator: userAddress },
        fromBlock: DEPLOYMENT_BLOCK,
        toBlock: "latest",
      });

      // Fetch full spec details for each
      const specs: JobSpecWithId[] = await Promise.all(
        logs.map(async (log) => {
          const specId = log.args.specId!;
          const spec = await publicClient.readContract({
            address: JOB_REGISTRY_ADDRESS,
            abi: jobRegistryAbi,
            functionName: "getJobSpec",
            args: [specId],
          });
          return { ...spec, id: specId } as JobSpecWithId;
        })
      );

      return specs;
    },
    enabled: !!userAddress && !!publicClient,
  });
}

/**
 * Fetch all jobs created by a specific address using event logs
 */
export function useUserJobs(userAddress: `0x${string}` | undefined) {
  const chain = getActiveChain();
  const publicClient = usePublicClient({ chainId: chain.id });

  return useQuery({
    queryKey: ["userJobs", userAddress, chain.id],
    queryFn: async () => {
      if (!userAddress || !publicClient) return [];

      // Fetch JobCreated events filtered by requester
      const logs = await publicClient.getLogs({
        address: JOB_REGISTRY_ADDRESS,
        event: JobCreatedEvent,
        args: { requester: userAddress },
        fromBlock: DEPLOYMENT_BLOCK,
        toBlock: "latest",
      });

      // Fetch full job details for each
      const jobs: JobWithId[] = await Promise.all(
        logs.map(async (log) => {
          const jobId = log.args.jobId!;
          const job = await publicClient.readContract({
            address: JOB_REGISTRY_ADDRESS,
            abi: jobRegistryAbi,
            functionName: "getJob",
            args: [jobId],
          });
          return { ...job, id: jobId } as JobWithId;
        })
      );

      return jobs;
    },
    enabled: !!userAddress && !!publicClient,
  });
}

/**
 * Fetch all job specs in the system (for browse page)
 * Uses batch query for efficiency (2 RPC calls instead of N+1)
 */
export function useAllJobSpecs() {
  const chain = getActiveChain();
  const publicClient = usePublicClient({ chainId: chain.id });

  return useQuery({
    queryKey: ["allJobSpecs", chain.id],
    queryFn: async () => {
      if (!publicClient) return [];

      // Get total count first
      const count = await publicClient.readContract({
        address: JOB_REGISTRY_ADDRESS,
        abi: jobRegistryAbi,
        functionName: "getJobSpecCount",
      });

      if (count === BigInt(0)) return [];

      // Fetch all specs in one batch call
      const specs = await publicClient.readContract({
        address: JOB_REGISTRY_ADDRESS,
        abi: jobRegistryAbi,
        functionName: "getJobSpecsRange",
        args: [BigInt(0), count],
      });

      // Add IDs to specs
      return specs.map((spec, index) => ({
        ...spec,
        id: BigInt(index),
      })) as JobSpecWithId[];
    },
    enabled: !!publicClient,
  });
}

/**
 * Fetch all jobs for a specific spec
 */
export function useJobsForSpec(specId: bigint | undefined) {
  const chain = getActiveChain();
  const publicClient = usePublicClient({ chainId: chain.id });

  return useQuery({
    queryKey: ["jobsForSpec", specId?.toString(), chain.id],
    queryFn: async () => {
      if (specId === undefined || !publicClient) return [];

      // Fetch JobCreated events filtered by specId
      const logs = await publicClient.getLogs({
        address: JOB_REGISTRY_ADDRESS,
        event: JobCreatedEvent,
        args: { specId },
        fromBlock: DEPLOYMENT_BLOCK,
        toBlock: "latest",
      });

      // Fetch full job details for each
      const jobs: JobWithId[] = await Promise.all(
        logs.map(async (log) => {
          const jobId = log.args.jobId!;
          const job = await publicClient.readContract({
            address: JOB_REGISTRY_ADDRESS,
            abi: jobRegistryAbi,
            functionName: "getJob",
            args: [jobId],
          });
          return { ...job, id: jobId } as JobWithId;
        })
      );

      return jobs;
    },
    enabled: specId !== undefined && !!publicClient,
  });
}
