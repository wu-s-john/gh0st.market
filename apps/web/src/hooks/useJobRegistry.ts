"use client";

import { useReadContract, usePublicClient, useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { parseAbiItem } from "viem";
import { jobRegistryAbi } from "@/generated";
import { useJobRegistryConfig, useJobRegistryAddress, useDeploymentBlock } from "./useContractConfig";

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
  const config = useJobRegistryConfig();

  return useReadContract({
    ...config,
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
  const config = useJobRegistryConfig();

  return useReadContract({
    ...config,
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
  const config = useJobRegistryConfig();

  return useReadContract({
    ...config,
    functionName: "getJobSpecCount",
  });
}

/**
 * Fetch total job count
 */
export function useJobCount() {
  const config = useJobRegistryConfig();

  return useReadContract({
    ...config,
    functionName: "getJobCount",
  });
}

/**
 * Fetch all job specs created by a specific address using event logs
 */
export function useUserJobSpecs(userAddress: `0x${string}` | undefined) {
  const { chain } = useAccount();
  const chainId = chain?.id ?? 11155111;
  const publicClient = usePublicClient({ chainId });
  const registryAddress = useJobRegistryAddress();
  const deploymentBlock = useDeploymentBlock();

  return useQuery({
    queryKey: ["userJobSpecs", userAddress, chainId, registryAddress],
    queryFn: async () => {
      if (!userAddress || !publicClient) return [];

      // Fetch JobSpecCreated events filtered by creator
      const logs = await publicClient.getLogs({
        address: registryAddress,
        event: JobSpecCreatedEvent,
        args: { creator: userAddress },
        fromBlock: deploymentBlock,
        toBlock: "latest",
      });

      // Fetch full spec details for each
      const specs: JobSpecWithId[] = await Promise.all(
        logs.map(async (log) => {
          const specId = log.args.specId!;
          const spec = await publicClient.readContract({
            address: registryAddress,
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
  const { chain } = useAccount();
  const chainId = chain?.id ?? 11155111;
  const publicClient = usePublicClient({ chainId });
  const registryAddress = useJobRegistryAddress();
  const deploymentBlock = useDeploymentBlock();

  return useQuery({
    queryKey: ["userJobs", userAddress, chainId, registryAddress],
    queryFn: async () => {
      if (!userAddress || !publicClient) return [];

      // Fetch JobCreated events filtered by requester
      const logs = await publicClient.getLogs({
        address: registryAddress,
        event: JobCreatedEvent,
        args: { requester: userAddress },
        fromBlock: deploymentBlock,
        toBlock: "latest",
      });

      // Fetch full job details for each
      const jobs: JobWithId[] = await Promise.all(
        logs.map(async (log) => {
          const jobId = log.args.jobId!;
          const job = await publicClient.readContract({
            address: registryAddress,
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
  const { chain } = useAccount();
  const chainId = chain?.id ?? 11155111;
  const publicClient = usePublicClient({ chainId });
  const registryAddress = useJobRegistryAddress();

  return useQuery({
    queryKey: ["allJobSpecs", chainId, registryAddress],
    queryFn: async () => {
      if (!publicClient) return [];

      // Get total count first
      const count = await publicClient.readContract({
        address: registryAddress,
        abi: jobRegistryAbi,
        functionName: "getJobSpecCount",
      });

      if (count === BigInt(0)) return [];

      // Fetch all specs in one batch call
      const specs = await publicClient.readContract({
        address: registryAddress,
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
  const { chain } = useAccount();
  const chainId = chain?.id ?? 11155111;
  const publicClient = usePublicClient({ chainId });
  const registryAddress = useJobRegistryAddress();
  const deploymentBlock = useDeploymentBlock();

  return useQuery({
    queryKey: ["jobsForSpec", specId?.toString(), chainId, registryAddress],
    queryFn: async () => {
      if (specId === undefined || !publicClient) return [];

      // Fetch JobCreated events filtered by specId
      const logs = await publicClient.getLogs({
        address: registryAddress,
        event: JobCreatedEvent,
        args: { specId },
        fromBlock: deploymentBlock,
        toBlock: "latest",
      });

      // Fetch full job details for each
      const jobs: JobWithId[] = await Promise.all(
        logs.map(async (log) => {
          const jobId = log.args.jobId!;
          const job = await publicClient.readContract({
            address: registryAddress,
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

// Job status enum matching contract
export const JobStatus = {
  Open: 0,
  Completed: 1,
} as const;

/**
 * Fetch all open jobs in the system (for worker browse page)
 * Uses batch query for efficiency, then filters client-side for Open status
 */
export function useAllOpenJobs() {
  const { chain } = useAccount();
  const chainId = chain?.id ?? 11155111;
  const publicClient = usePublicClient({ chainId });
  const registryAddress = useJobRegistryAddress();

  return useQuery({
    queryKey: ["allOpenJobs", chainId, registryAddress],
    queryFn: async () => {
      if (!publicClient) return [];

      // Get total count first
      const count = await publicClient.readContract({
        address: registryAddress,
        abi: jobRegistryAbi,
        functionName: "getJobCount",
      });

      if (count === BigInt(0)) return [];

      // Fetch all jobs in one batch call
      const jobs = await publicClient.readContract({
        address: registryAddress,
        abi: jobRegistryAbi,
        functionName: "getJobsRange",
        args: [BigInt(0), count],
      });

      // Add IDs and filter to only Open jobs
      return jobs
        .map((job, index) => ({
          ...job,
          id: BigInt(index),
        }))
        .filter((job) => job.status === JobStatus.Open) as JobWithId[];
    },
    enabled: !!publicClient,
  });
}

/**
 * Fetch all jobs (including completed) for analytics/history
 */
export function useAllJobs() {
  const { chain } = useAccount();
  const chainId = chain?.id ?? 11155111;
  const publicClient = usePublicClient({ chainId });
  const registryAddress = useJobRegistryAddress();

  return useQuery({
    queryKey: ["allJobs", chainId, registryAddress],
    queryFn: async () => {
      if (!publicClient) return [];

      const count = await publicClient.readContract({
        address: registryAddress,
        abi: jobRegistryAbi,
        functionName: "getJobCount",
      });

      if (count === BigInt(0)) return [];

      const jobs = await publicClient.readContract({
        address: registryAddress,
        abi: jobRegistryAbi,
        functionName: "getJobsRange",
        args: [BigInt(0), count],
      });

      return jobs.map((job, index) => ({
        ...job,
        id: BigInt(index),
      })) as JobWithId[];
    },
    enabled: !!publicClient,
  });
}
