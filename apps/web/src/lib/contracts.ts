import { jobRegistryAbi } from "@/generated";
import { CHAIN_CONFIG, getChainConfigOrDefault } from "./contracts.config";
import { getChainSettings } from "./settings";

/**
 * Get contract address for a specific chain (from settings or config)
 */
export function getJobRegistryAddress(chainId: number): `0x${string}` {
  return getChainSettings(chainId).jobRegistryAddress;
}

/**
 * Get deployment block for a specific chain (from settings or config)
 */
export function getDeploymentBlock(chainId: number): bigint {
  return getChainSettings(chainId).deploymentBlock;
}

/**
 * Get contract config for a specific chain
 */
export function getJobRegistryConfig(chainId: number) {
  return {
    address: getJobRegistryAddress(chainId),
    abi: jobRegistryAbi,
  } as const;
}

// Event signatures for log queries
export const jobRegistryEvents = {
  JobSpecCreated: jobRegistryAbi.find(
    (item) => item.type === "event" && item.name === "JobSpecCreated"
  ),
  JobCreated: jobRegistryAbi.find(
    (item) => item.type === "event" && item.name === "JobCreated"
  ),
  WorkSubmitted: jobRegistryAbi.find(
    (item) => item.type === "event" && item.name === "WorkSubmitted"
  ),
  JobSpecActiveChanged: jobRegistryAbi.find(
    (item) => item.type === "event" && item.name === "JobSpecActiveChanged"
  ),
} as const;
