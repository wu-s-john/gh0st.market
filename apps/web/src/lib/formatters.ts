import { formatEther } from "viem";
import type { JobWithId, JobSpecWithId } from "@/hooks/useJobRegistry";
import type { Job } from "@/components/tables/JobsTable";
import type { JobSpec } from "@/components/tables/JobSpecsTable";

// Convert contract job status (0 = Open, 1 = Completed) to string
export function formatJobStatus(status: number): "Open" | "Completed" {
  return status === 0 ? "Open" : "Completed";
}

// Format wei to ETH string (max 4 decimals)
export function formatBounty(bounty: bigint): string {
  const ethValue = formatEther(bounty);
  const num = parseFloat(ethValue);
  if (num === 0) return "0";
  if (num < 0.0001) return "<0.0001";
  return num.toFixed(4).replace(/\.?0+$/, "");
}

// Get token symbol from address
export function getTokenSymbol(tokenAddress: `0x${string}`): string {
  // Native ETH
  if (tokenAddress === "0x0000000000000000000000000000000000000000") {
    return "ETH";
  }
  // TODO: Add known token mappings (USDC, etc.)
  // For now, return truncated address
  return `${tokenAddress.slice(0, 6)}...`;
}

// Convert bigint ID to hex string
export function formatJobId(id: bigint): string {
  return `0x${id.toString(16).padStart(8, "0")}`;
}

// Convert blockchain Job to UI Job format
export function formatJobForUI(
  job: JobWithId,
  specMainDomain?: string
): Job {
  return {
    id: formatJobId(job.id),
    specId: job.specId.toString(),
    targetDomain: specMainDomain || `Spec #${job.specId.toString()}`,
    status: formatJobStatus(job.status),
    bounty: formatBounty(job.bounty),
    token: getTokenSymbol(job.token),
    createdAt: Number(job.createdAt) * 1000, // Convert to milliseconds
    requester: job.requester,
  };
}

// Convert blockchain JobSpec to UI JobSpec format
export function formatJobSpecForUI(
  spec: JobSpecWithId,
  jobCount: number = 0
): JobSpec {
  return {
    id: spec.id.toString(),
    mainDomain: spec.mainDomain,
    notarizeUrl: spec.notarizeUrl,
    description: spec.description,
    promptInstructions: spec.promptInstructions,
    inputSchema: spec.inputSchema,
    outputSchema: spec.outputSchema,
    creator: spec.creator,
    createdAt: Number(spec.createdAt) * 1000, // Convert to milliseconds
    active: spec.active,
    jobCount,
  };
}

// Truncate address for display
export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Format timestamp to relative time
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
