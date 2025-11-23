import { jobRegistryAbi } from "@/generated";
import {
  JOB_REGISTRY_ADDRESS,
  DEPLOYMENT_BLOCK,
  CHAIN_ID,
} from "./contracts.generated";

// Re-export generated values
export { JOB_REGISTRY_ADDRESS, DEPLOYMENT_BLOCK, CHAIN_ID };

// Typed contract config for wagmi hooks
export const jobRegistryConfig = {
  address: JOB_REGISTRY_ADDRESS,
  abi: jobRegistryAbi,
} as const;

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
