"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ExtensionStatus, useExtensionStatus } from "@/components/ExtensionStatus";
import { Button } from "@/components/ui";

// Types
interface SpecDetails {
  id: string;
  mainDomain: string;
  notarizeUrl: string;
  description: string;
  creator: string;
  createdAt: number;
  active: boolean;
  isApproved: boolean;
  minPrice: string;
  token: string;
}

interface AvailableJob {
  id: string;
  specId: string;
  bounty: string;
  token: string;
  createdAt: number;
  input: Record<string, string>;
  aboveMinPrice: boolean;
}

type FilterType = "all" | "above_min" | "below_min";

// Mock data
const mockSpecDetails: Record<string, SpecDetails> = {
  "1": {
    id: "1",
    mainDomain: "crunchbase.com",
    notarizeUrl: "https://crunchbase.com/organization/{{orgSlug}}",
    description: "Fetch Crunchbase organization profiles with funding and employee data",
    creator: "0x7f3a8b2c9d4e5f6a1b2c3d4e5f6a7b8c",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    active: true,
    isApproved: true,
    minPrice: "0.25",
    token: "USDC",
  },
};

const mockJobsForSpec: Record<string, AvailableJob[]> = {
  "1": [
    {
      id: "0x7f3a8b2c9d4e5f6a1b2c3d4e5f6a7b8c",
      specId: "1",
      bounty: "2.00",
      token: "USDC",
      createdAt: Date.now() - 1000 * 60 * 2,
      input: { orgSlug: "anthropic" },
      aboveMinPrice: true,
    },
    {
      id: "0x2b1c3d4e5f6a7b8c9d0e1f2a3b4c5d6e",
      specId: "1",
      bounty: "1.50",
      token: "USDC",
      createdAt: Date.now() - 1000 * 60 * 15,
      input: { orgSlug: "openai" },
      aboveMinPrice: true,
    },
    {
      id: "0x9c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
      specId: "1",
      bounty: "0.75",
      token: "USDC",
      createdAt: Date.now() - 1000 * 60 * 60,
      input: { orgSlug: "stripe" },
      aboveMinPrice: true,
    },
    {
      id: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
      specId: "1",
      bounty: "0.30",
      token: "USDC",
      createdAt: Date.now() - 1000 * 60 * 120,
      input: { orgSlug: "notion" },
      aboveMinPrice: true,
    },
    {
      id: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
      specId: "1",
      bounty: "0.20",
      token: "USDC",
      createdAt: Date.now() - 1000 * 60 * 180,
      input: { orgSlug: "figma" },
      aboveMinPrice: false,
    },
    {
      id: "0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
      specId: "1",
      bounty: "0.15",
      token: "USDC",
      createdAt: Date.now() - 1000 * 60 * 240,
      input: { orgSlug: "linear" },
      aboveMinPrice: false,
    },
  ],
};

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

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Claim Job Modal
function ClaimJobModal({
  isOpen,
  onClose,
  onSubmit,
  job,
  spec,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobId: string) => void;
  job: AvailableJob | null;
  spec: SpecDetails | null;
  isSubmitting: boolean;
}) {
  const { connected } = useExtensionStatus();

  if (!isOpen || !job || !spec) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-lg w-full max-w-md mx-4 p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-xl font-bold text-[var(--text-primary)] mb-4">
          Claim Job
        </h2>

        {/* Extension Status */}
        <div className="mb-6">
          <ExtensionStatus variant="inline" />
        </div>

        {/* Job Info */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between">
            <span className="text-sm text-[var(--text-muted)]">Job ID:</span>
            <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--text-primary)]">
              {truncateAddress(job.id)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[var(--text-muted)]">Spec:</span>
            <span className="text-sm text-[var(--text-primary)]">{spec.mainDomain}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[var(--text-muted)]">Bounty:</span>
            <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--success)]">
              {job.bounty} {job.token}
            </span>
          </div>
        </div>

        {/* Input Preview */}
        <div className="mb-6">
          <p className="text-xs text-[var(--text-muted)] mb-2">Input:</p>
          <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-md">
            <code className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--text-secondary)]">
              {JSON.stringify(job.input, null, 2)}
            </code>
          </div>
        </div>

        {/* Warning if extension not connected */}
        {!connected && (
          <div className="mb-6 p-3 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-md">
            <p className="text-sm text-[var(--error)]">
              Extension not connected. Please install and connect the extension to claim jobs.
            </p>
          </div>
        )}

        {/* Info */}
        <p className="text-xs text-[var(--text-muted)] mb-6">
          The task will begin automatically in your browser extension after claiming.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(job.id)}
            disabled={isSubmitting || !connected}
            className="flex-1"
          >
            {isSubmitting ? "..." : "Claim & Start Task"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function WorkerJobsPage() {
  const params = useParams();
  const router = useRouter();
  const specId = params.specId as string;

  const [filter, setFilter] = useState<FilterType>("above_min");
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<AvailableJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get spec details and jobs (mock)
  const spec = mockSpecDetails[specId] || mockSpecDetails["1"];
  const allJobs = mockJobsForSpec[specId] || mockJobsForSpec["1"];

  const filteredJobs = allJobs.filter((job) => {
    if (filter === "above_min") return job.aboveMinPrice;
    if (filter === "below_min") return !job.aboveMinPrice;
    return true;
  });

  const aboveMinCount = allJobs.filter((j) => j.aboveMinPrice).length;
  const belowMinCount = allJobs.filter((j) => !j.aboveMinPrice).length;

  const handleClaimClick = (job: AvailableJob) => {
    setSelectedJob(job);
    setIsClaimModalOpen(true);
  };

  const handleClaimSubmit = async (jobId: string) => {
    setIsSubmitting(true);
    console.log("Claiming job:", jobId);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsClaimModalOpen(false);
    setSelectedJob(null);
    // TODO: Navigate to active tasks or show success
  };

  return (
    <DashboardLayout role="worker">
      {/* Back Link */}
      <button
        onClick={() => router.push("/worker/jobSpecs")}
        className="inline-flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-hover)] mb-6 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
        Back to Browse Specs
      </button>

      {/* Spec Details Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 mb-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-[var(--text-primary)] mb-2">
              {spec.mainDomain}
            </h1>
            <p className="text-[var(--text-secondary)]">
              {spec.description}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-sm ${
              spec.isApproved ? "text-[var(--success)]" : "text-[var(--text-muted)]"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            {spec.isApproved ? "Approved" : "Not Approved"}
          </span>
        </div>

        {/* Min Price */}
        {spec.isApproved && (
          <div className="flex items-center gap-4 p-3 bg-[var(--background)] border border-[var(--border)] rounded-md">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Your minimum price</p>
              <p className="font-[family-name:var(--font-jetbrains-mono)] text-lg text-[var(--text-primary)]">
                {spec.minPrice} {spec.token}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => router.push("/worker/jobSpecs")}
            >
              Edit Settings
            </Button>
          </div>
        )}
      </div>

      {/* Jobs Section */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-semibold text-[var(--text-primary)]">
            Available Jobs
          </h2>
          <span className="text-sm text-[var(--text-muted)]">
            {allJobs.length} jobs
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-3 border-b border-[var(--border)] flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === "all"
                ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            All ({allJobs.length})
          </button>
          <button
            onClick={() => setFilter("above_min")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === "above_min"
                ? "bg-[var(--surface-2)] text-[var(--success)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Above Min Price ({aboveMinCount})
          </button>
          <button
            onClick={() => setFilter("below_min")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === "below_min"
                ? "bg-[var(--surface-2)] text-[var(--text-muted)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Below Min Price ({belowMinCount})
          </button>
        </div>

        {/* Jobs Table */}
        <div className="p-2">
          {filteredJobs.length === 0 ? (
            <div className="py-8 text-center text-[var(--text-muted)]">
              No jobs match the current filter
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
                      Input
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
                  {filteredJobs.map((job) => (
                    <tr
                      key={job.id}
                      className={`
                        border-b border-[var(--border)] last:border-b-0
                        hover:bg-[var(--surface-2)] transition-colors duration-150
                        ${!job.aboveMinPrice ? "opacity-50" : ""}
                      `}
                    >
                      <td className="py-3 px-4">
                        <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--text-primary)]">
                          {truncateAddress(job.id)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--text-secondary)]">
                          {Object.values(job.input)[0]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-[family-name:var(--font-jetbrains-mono)] text-sm ${
                            job.aboveMinPrice ? "text-[var(--success)]" : "text-[var(--text-muted)]"
                          }`}
                        >
                          {job.bounty} {job.token}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-[var(--text-muted)]">
                          {formatTimeAgo(job.createdAt)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {job.aboveMinPrice ? (
                          <Button
                            size="sm"
                            onClick={() => handleClaimClick(job)}
                          >
                            Claim
                          </Button>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">
                            Below min
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Claim Modal */}
      <ClaimJobModal
        isOpen={isClaimModalOpen}
        onClose={() => {
          setIsClaimModalOpen(false);
          setSelectedJob(null);
        }}
        onSubmit={handleClaimSubmit}
        job={selectedJob}
        spec={spec}
        isSubmitting={isSubmitting}
      />
    </DashboardLayout>
  );
}
