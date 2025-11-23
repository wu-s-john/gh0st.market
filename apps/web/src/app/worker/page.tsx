"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ExtensionStatus, useExtensionStatus } from "@/components/ExtensionStatus";
import { ExtensionRequiredCard } from "@/components/ExtensionRequiredCard";
import { Button } from "@/components/ui";
import { useExtensionJob } from "@/hooks/useExtensionJob";
import {
  useFollowedSpecs,
  useActiveJobs,
  type FollowedSpec,
  type ActiveJob,
} from "@/hooks/useExtension";
import {
  useAllOpenJobs,
  useAllJobSpecs,
  type JobWithId,
  type JobSpecWithId,
} from "@/hooks/useJobRegistry";

// Map extension job status to UI display
function mapExtensionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "Starting",
    navigating: "Navigating",
    collecting: "Collecting",
    generating_proof: "Generating Proof",
    submitting: "Submitting",
    completed: "Completed",
    failed: "Failed",
  };
  return statusMap[status] || status;
}

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimeAgo(timestamp: number | bigint): string {
  const ts = typeof timestamp === "bigint" ? Number(timestamp) * 1000 : timestamp;
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatBounty(bounty: bigint): string {
  const eth = formatEther(bounty);
  // Show up to 4 decimal places
  const num = parseFloat(eth);
  return num < 0.0001 ? "<0.0001" : num.toFixed(4);
}

function ActiveTaskStatusBadge({ status }: { status: string }) {
  const isRunning = ["pending", "navigating", "collecting", "generating_proof", "submitting"].includes(status);
  const isFailed = status === "failed";
  const isCompleted = status === "completed";

  const color = isFailed
    ? "var(--error)"
    : isCompleted
      ? "var(--success)"
      : "var(--accent)";

  return (
    <span className="inline-flex items-center gap-1.5" style={{ color }}>
      <span
        className={`w-2 h-2 rounded-full ${isRunning ? "animate-pulse" : ""}`}
        style={{ backgroundColor: color }}
      />
      {mapExtensionStatus(status)}
    </span>
  );
}

export default function WorkerDashboard() {
  const router = useRouter();
  const { address } = useAccount();
  const { connected: extensionConnected } = useExtensionStatus();
  const { startJob, isRunning } = useExtensionJob();

  // Data from extension
  const {
    specs: followedSpecs,
    loading: followedSpecsLoading,
  } = useFollowedSpecs(address);

  const {
    jobs: activeJobs,
    loading: activeJobsLoading,
  } = useActiveJobs();

  // Data from blockchain
  const { data: allOpenJobs, isLoading: openJobsLoading } = useAllOpenJobs();
  const { data: allSpecs, isLoading: specsLoading } = useAllJobSpecs();

  // Create lookup maps
  const followedSpecIds = useMemo(() => {
    return new Set(followedSpecs.map((s) => s.specId));
  }, [followedSpecs]);

  const followedSpecMap = useMemo(() => {
    const map = new Map<number, FollowedSpec>();
    followedSpecs.forEach((s) => map.set(s.specId, s));
    return map;
  }, [followedSpecs]);

  const specMap = useMemo(() => {
    const map = new Map<bigint, JobSpecWithId>();
    allSpecs?.forEach((s) => map.set(s.id, s));
    return map;
  }, [allSpecs]);

  // Filter available jobs to those matching followed specs
  const availableJobs = useMemo(() => {
    if (!allOpenJobs || !extensionConnected) return [];

    return allOpenJobs.filter((job) => {
      const specId = Number(job.specId);
      if (!followedSpecIds.has(specId)) return false;

      // Check minimum bounty
      const followedSpec = followedSpecMap.get(specId);
      if (followedSpec && followedSpec.minBounty > 0) {
        const bountyEth = parseFloat(formatEther(job.bounty));
        if (bountyEth < followedSpec.minBounty) return false;
      }

      return true;
    });
  }, [allOpenJobs, followedSpecIds, followedSpecMap, extensionConnected]);

  // Count available jobs per followed spec
  const jobCountBySpec = useMemo(() => {
    const counts = new Map<number, number>();
    availableJobs.forEach((job) => {
      const specId = Number(job.specId);
      counts.set(specId, (counts.get(specId) || 0) + 1);
    });
    return counts;
  }, [availableJobs]);

  const handleClaimJob = (job: JobWithId) => {
    const spec = specMap.get(job.specId);
    if (!spec) return;

    let inputs: Record<string, string> = {};
    try {
      inputs = job.inputs ? JSON.parse(job.inputs) : {};
    } catch {
      // Invalid JSON, use empty
    }

    startJob({
      jobId: job.id.toString(),
      specId: Number(job.specId),
      mainDomain: spec.mainDomain,
      notarizeUrl: spec.notarizeUrl,
      inputs,
      promptInstructions: spec.promptInstructions,
      outputSchema: spec.outputSchema,
      bounty: formatBounty(job.bounty),
      token: job.token === "0x0000000000000000000000000000000000000000" ? "ETH" : "ERC20",
    });
  };

  const isLoading = followedSpecsLoading || activeJobsLoading || openJobsLoading || specsLoading;

  return (
    <DashboardLayout role="worker">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-[var(--text-primary)] mb-2">
          Dashboard
        </h1>
        <p className="text-[var(--text-secondary)]">
          Manage your tasks and browse available jobs
        </p>
      </div>

      {/* Content Grid */}
      <div className="space-y-6">
        {/* Extension Status Card */}
        <ExtensionStatus variant="card" showActiveTask={true} />

        {/* Active Tasks Section */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-semibold text-[var(--text-primary)]">
              Active Tasks
            </h2>
            <span className="text-sm text-[var(--text-muted)]">
              {extensionConnected ? activeJobs.length : "-"}
            </span>
          </div>
          <div className="p-2">
            {!extensionConnected ? (
              <ExtensionRequiredCard
                variant="inline"
                description="Install the extension to see and run active tasks."
              />
            ) : activeJobsLoading ? (
              <div className="py-8 text-center text-[var(--text-muted)]">
                Loading...
              </div>
            ) : activeJobs.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-muted)]">
                No active tasks
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                        Job ID
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                        Domain
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                        Bounty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeJobs.map((job) => (
                      <tr
                        key={job.jobId}
                        className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors duration-150"
                      >
                        <td className="py-3 px-4">
                          <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--text-primary)]">
                            {truncateAddress(job.jobId)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-[var(--text-secondary)]">
                            {job.mainDomain}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <ActiveTaskStatusBadge status={job.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--success)]">
                            {job.bounty} {job.token}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Approved Job Specs Section */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-semibold text-[var(--text-primary)]">
              Approved Job Specs
            </h2>
            <span className="text-sm text-[var(--text-muted)]">
              {extensionConnected ? `${followedSpecs.length} specs` : "-"}
            </span>
          </div>
          <div className="p-2">
            {!extensionConnected ? (
              <ExtensionRequiredCard
                variant="inline"
                description="Install the extension to approve and manage job specs."
              />
            ) : followedSpecsLoading ? (
              <div className="py-8 text-center text-[var(--text-muted)]">
                Loading...
              </div>
            ) : followedSpecs.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-muted)]">
                <p className="mb-4">You haven&apos;t approved any job specs yet</p>
                <Button size="sm" onClick={() => router.push("/worker/jobSpecs")}>
                  Browse Specs
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                        Domain
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                        Min Price
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                        Available Jobs
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {followedSpecs.map((spec) => (
                      <tr
                        key={spec.specId}
                        onClick={() => router.push(`/worker/jobSpecs/${spec.specId}/jobs`)}
                        className="border-b border-[var(--border)] last:border-b-0 cursor-pointer hover:bg-[var(--surface-2)] transition-colors duration-150"
                      >
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {spec.mainDomain}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--text-secondary)]">
                            {spec.minBounty} ETH
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-[var(--accent)]">
                            {jobCountBySpec.get(spec.specId) || 0} available
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {extensionConnected && followedSpecs.length > 0 && (
            <div className="px-6 py-3 border-t border-[var(--border)]">
              <button
                onClick={() => router.push("/worker/jobSpecs")}
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                Manage Specs
              </button>
            </div>
          )}
        </div>

        {/* Available Jobs Section */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-semibold text-[var(--text-primary)]">
              Available Jobs
            </h2>
            <span className="text-sm text-[var(--text-muted)]">
              {availableJobs.length} matching
            </span>
          </div>
          <div className="p-2">
            {!extensionConnected ? (
              <ExtensionRequiredCard
                variant="inline"
                description="Install the extension to claim and complete jobs."
              />
            ) : openJobsLoading ? (
              <div className="py-8 text-center text-[var(--text-muted)]">
                Loading jobs from blockchain...
              </div>
            ) : availableJobs.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-muted)]">
                {followedSpecs.length === 0
                  ? "Approve some job specs to see available jobs"
                  : "No jobs available for your approved specs"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                        Domain
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                        Bounty
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                        Posted
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableJobs.slice(0, 10).map((job) => {
                      const spec = specMap.get(job.specId);
                      return (
                        <tr
                          key={job.id.toString()}
                          className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors duration-150"
                        >
                          <td className="py-3 px-4">
                            <span className="text-sm text-[var(--text-primary)]">
                              {spec?.mainDomain || "Unknown"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--success)]">
                              {formatBounty(job.bounty)} ETH
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-[var(--text-muted)]">
                              {formatTimeAgo(job.createdAt)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              onClick={() => handleClaimJob(job)}
                              disabled={isRunning}
                            >
                              {isRunning ? "Busy" : "Claim"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {availableJobs.length > 10 && (
            <div className="px-6 py-3 border-t border-[var(--border)]">
              <button
                onClick={() => router.push("/worker/jobSpecs")}
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                View All {availableJobs.length} Jobs
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
