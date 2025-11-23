"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ExtensionStatus } from "@/components/ExtensionStatus";
import { Button } from "@/components/ui";

// Worker-specific job status types
export type WorkerJobStatus =
  | "Available"
  | "Claimed"
  | "Running"
  | "PendingProof"
  | "Submitted"
  | "Verified"
  | "Failed";

export interface WorkerJob {
  id: string;
  specId: string;
  specDomain: string;
  status: WorkerJobStatus;
  bounty: string;
  token: string;
  createdAt: number;
  input?: Record<string, string>;
}

export interface ApprovedSpec {
  id: string;
  mainDomain: string;
  minPrice: string;
  token: string;
  availableJobs: number;
}

// Mock data
const mockActiveTasks: WorkerJob[] = [
  {
    id: "0x7f3a8b2c9d4e5f6a1b2c3d4e5f6a7b8c",
    specId: "1",
    specDomain: "crunchbase.com",
    status: "Running",
    bounty: "0.50",
    token: "USDC",
    createdAt: Date.now() - 1000 * 60 * 2,
    input: { orgSlug: "anthropic" },
  },
  {
    id: "0x2b1c3d4e5f6a7b8c9d0e1f2a3b4c5d6e",
    specId: "2",
    specDomain: "linkedin.com",
    status: "PendingProof",
    bounty: "1.20",
    token: "USDC",
    createdAt: Date.now() - 1000 * 60 * 15,
    input: { companySlug: "openai" },
  },
];

const mockApprovedSpecs: ApprovedSpec[] = [
  {
    id: "1",
    mainDomain: "crunchbase.com",
    minPrice: "0.25",
    token: "USDC",
    availableJobs: 12,
  },
  {
    id: "2",
    mainDomain: "linkedin.com",
    minPrice: "0.50",
    token: "USDC",
    availableJobs: 5,
  },
  {
    id: "4",
    mainDomain: "github.com",
    minPrice: "0.10",
    token: "USDC",
    availableJobs: 23,
  },
];

const mockAvailableJobs: WorkerJob[] = [
  {
    id: "0x9c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
    specId: "1",
    specDomain: "crunchbase.com",
    status: "Available",
    bounty: "2.00",
    token: "USDC",
    createdAt: Date.now() - 1000 * 60 * 2,
  },
  {
    id: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
    specId: "2",
    specDomain: "linkedin.com",
    status: "Available",
    bounty: "1.50",
    token: "USDC",
    createdAt: Date.now() - 1000 * 60 * 15,
  },
  {
    id: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
    specId: "1",
    specDomain: "crunchbase.com",
    status: "Available",
    bounty: "0.75",
    token: "USDC",
    createdAt: Date.now() - 1000 * 60 * 60,
  },
  {
    id: "0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
    specId: "4",
    specDomain: "github.com",
    status: "Available",
    bounty: "0.30",
    token: "USDC",
    createdAt: Date.now() - 1000 * 60 * 120,
  },
];

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function WorkerJobStatusBadge({ status }: { status: WorkerJobStatus }) {
  const config: Record<WorkerJobStatus, { color: string; label: string }> = {
    Available: { color: "var(--text-muted)", label: "Available" },
    Claimed: { color: "var(--accent)", label: "Claimed" },
    Running: { color: "var(--accent)", label: "Running" },
    PendingProof: { color: "var(--warning)", label: "Pending Proof" },
    Submitted: { color: "var(--info)", label: "Submitted" },
    Verified: { color: "var(--success)", label: "Verified" },
    Failed: { color: "var(--error)", label: "Failed" },
  };

  const { color, label } = config[status];

  return (
    <span className="inline-flex items-center gap-1.5" style={{ color }}>
      <span
        className={`w-2 h-2 rounded-full ${status === "Running" ? "animate-pulse" : ""}`}
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

export default function WorkerDashboard() {
  const router = useRouter();
  const [claimingJobId, setClaimingJobId] = useState<string | null>(null);

  const handleClaimJob = async (jobId: string) => {
    setClaimingJobId(jobId);
    // TODO: Open claim modal and handle claiming
    console.log("Claiming job:", jobId);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setClaimingJobId(null);
  };

  const totalAvailableJobs = mockApprovedSpecs.reduce(
    (sum, spec) => sum + spec.availableJobs,
    0
  );

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
              {mockActiveTasks.length}
            </span>
          </div>
          <div className="p-2">
            {mockActiveTasks.length === 0 ? (
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
                        Spec Domain
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
                    {mockActiveTasks.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors duration-150"
                      >
                        <td className="py-3 px-4">
                          <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--text-primary)]">
                            {truncateAddress(job.id)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-[var(--text-secondary)]">
                            {job.specDomain}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <WorkerJobStatusBadge status={job.status} />
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
          {mockActiveTasks.length > 0 && (
            <div className="px-6 py-3 border-t border-[var(--border)]">
              <button className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                View History
              </button>
            </div>
          )}
        </div>

        {/* Approved Job Specs Section */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-semibold text-[var(--text-primary)]">
              Approved Job Specs
            </h2>
            <span className="text-sm text-[var(--text-muted)]">
              {mockApprovedSpecs.length} specs
            </span>
          </div>
          <div className="p-2">
            {mockApprovedSpecs.length === 0 ? (
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
                    {mockApprovedSpecs.map((spec) => (
                      <tr
                        key={spec.id}
                        onClick={() => router.push(`/worker/jobSpecs/${spec.id}/jobs`)}
                        className="border-b border-[var(--border)] last:border-b-0 cursor-pointer hover:bg-[var(--surface-2)] transition-colors duration-150"
                      >
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {spec.mainDomain}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--text-secondary)]">
                            {spec.minPrice} {spec.token}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-[var(--accent)]">
                            {spec.availableJobs} available
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {mockApprovedSpecs.length > 0 && (
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
              {totalAvailableJobs} matching
            </span>
          </div>
          <div className="p-2">
            {mockAvailableJobs.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-muted)]">
                No jobs available for your approved specs
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                        Spec Domain
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
                    {mockAvailableJobs.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors duration-150"
                      >
                        <td className="py-3 px-4">
                          <span className="text-sm text-[var(--text-primary)]">
                            {job.specDomain}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--success)]">
                            {job.bounty} {job.token}
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
                            onClick={() => handleClaimJob(job.id)}
                            disabled={claimingJobId === job.id}
                          >
                            {claimingJobId === job.id ? "..." : "Claim"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {mockAvailableJobs.length > 0 && (
            <div className="px-6 py-3 border-t border-[var(--border)]">
              <button
                onClick={() => router.push("/worker/jobSpecs")}
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                Browse All Jobs
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
