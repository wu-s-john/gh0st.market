"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ExtensionRequiredCard } from "@/components/ExtensionRequiredCard";
import { Button } from "@/components/ui";
import { useExtensionStatus } from "@/components/ExtensionStatus";
import {
  useFollowedSpecs,
  useFollowSpec,
  type FollowedSpec,
} from "@/hooks/useExtension";
import {
  useAllJobSpecs,
  useAllOpenJobs,
  type JobSpecWithId,
} from "@/hooks/useJobRegistry";

type FilterType = "all" | "approved" | "not_approved";

// Combined spec type for UI
interface WorkerJobSpec {
  id: bigint;
  mainDomain: string;
  notarizeUrl: string;
  description: string;
  creator: string;
  createdAt: bigint;
  active: boolean;
  jobCount: number;
  isApproved: boolean;
  minBounty?: number;
}

function ApprovalStatusBadge({
  isApproved,
  minBounty,
}: {
  isApproved: boolean;
  minBounty?: number;
}) {
  if (isApproved) {
    return (
      <div className="flex flex-col">
        <span className="inline-flex items-center gap-1.5 text-[var(--success)]">
          <span className="w-2 h-2 rounded-full bg-current" />
          Approved
        </span>
        {minBounty !== undefined && minBounty > 0 && (
          <span className="text-xs text-[var(--text-muted)] mt-0.5">
            Min: {minBounty} ETH
          </span>
        )}
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
      <span className="w-2 h-2 rounded-full bg-current" />
      Not Approved
    </span>
  );
}

function WorkerJobSpecCard({
  spec,
  onApprove,
  onClick,
  extensionConnected,
}: {
  spec: WorkerJobSpec;
  onApprove: (spec: WorkerJobSpec) => void;
  onClick: (specId: bigint) => void;
  extensionConnected: boolean;
}) {
  return (
    <div
      className={`
        bg-[var(--surface)] border rounded-lg p-5 transition-all duration-150
        ${
          spec.isApproved
            ? "border-[var(--accent-muted)] hover:border-[var(--accent)]"
            : "border-[var(--border)] hover:border-[var(--border-hover)]"
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-[family-name:var(--font-jetbrains-mono)] text-base font-semibold text-[var(--text-primary)]">
          {spec.mainDomain}
        </h3>
        <ApprovalStatusBadge isApproved={spec.isApproved} minBounty={spec.minBounty} />
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
        {spec.description || "No description provided"}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] mb-4">
        <span>
          {spec.jobCount} {spec.jobCount === 1 ? "job" : "jobs"} available
        </span>
        <span className={spec.active ? "text-[var(--success)]" : ""}>
          {spec.active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {spec.isApproved ? (
          <>
            <Button size="sm" onClick={() => onClick(spec.id)} className="flex-1">
              View Jobs
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onApprove(spec)}
              disabled={!extensionConnected}
            >
              Edit
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={() => onApprove(spec)}
            className="flex-1"
            disabled={!extensionConnected}
          >
            {extensionConnected ? "Approve" : "Install Extension"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ApproveSpecModal({
  isOpen,
  onClose,
  onSubmit,
  spec,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (specId: bigint, minBounty: number) => void;
  spec: WorkerJobSpec | null;
  isSubmitting: boolean;
}) {
  const [minBounty, setMinBounty] = useState(spec?.minBounty?.toString() || "0");

  if (!isOpen || !spec) return null;

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
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-xl font-bold text-[var(--text-primary)] mb-4">
          {spec.isApproved ? "Edit Approval" : "Approve Job Spec"}
        </h2>

        {/* Spec Info */}
        <div className="mb-6">
          <h3 className="font-[family-name:var(--font-jetbrains-mono)] text-base font-semibold text-[var(--text-primary)] mb-2">
            {spec.mainDomain}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {spec.description || "No description provided"}
          </p>

          <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-md mb-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Notarize URL:</p>
            <code className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--info)] break-all">
              {spec.notarizeUrl}
            </code>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            By approving, you confirm you have authorized access to {spec.mainDomain} and
            can complete these data collection jobs.
          </p>
        </div>

        {/* Min Bounty Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Minimum bounty you&apos;ll accept
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.0001"
              min="0"
              value={minBounty}
              onChange={(e) => setMinBounty(e.target.value)}
              className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] font-[family-name:var(--font-jetbrains-mono)] focus:outline-none focus:border-[var(--accent)]"
              placeholder="0.001"
            />
            <span className="text-sm text-[var(--text-muted)]">ETH</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Jobs below this price won&apos;t appear in your available queue.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(spec.id, parseFloat(minBounty) || 0)}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "..." : spec.isApproved ? "Update" : "Approve Spec"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function WorkerBrowseSpecsPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { connected: extensionConnected } = useExtensionStatus();

  const [filter, setFilter] = useState<FilterType>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<WorkerJobSpec | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data from blockchain
  const { data: allSpecs, isLoading: specsLoading } = useAllJobSpecs();
  const { data: allOpenJobs, isLoading: jobsLoading } = useAllOpenJobs();

  // Data from extension
  const { specs: followedSpecs, loading: followedLoading } = useFollowedSpecs(address);
  const { followSpec, unfollowSpec } = useFollowSpec();

  // Create lookup for followed specs
  const followedSpecMap = useMemo(() => {
    const map = new Map<number, FollowedSpec>();
    followedSpecs.forEach((s) => map.set(s.specId, s));
    return map;
  }, [followedSpecs]);

  // Count open jobs per spec
  const jobCountBySpec = useMemo(() => {
    const counts = new Map<number, number>();
    allOpenJobs?.forEach((job) => {
      const specId = Number(job.specId);
      counts.set(specId, (counts.get(specId) || 0) + 1);
    });
    return counts;
  }, [allOpenJobs]);

  // Merge blockchain specs with extension approval data
  const mergedSpecs: WorkerJobSpec[] = useMemo(() => {
    if (!allSpecs) return [];

    return allSpecs.map((spec) => {
      const specId = Number(spec.id);
      const followed = followedSpecMap.get(specId);

      return {
        id: spec.id,
        mainDomain: spec.mainDomain,
        notarizeUrl: spec.notarizeUrl,
        description: spec.description,
        creator: spec.creator,
        createdAt: spec.createdAt,
        active: spec.active,
        jobCount: jobCountBySpec.get(specId) || 0,
        isApproved: !!followed,
        minBounty: followed?.minBounty,
      };
    });
  }, [allSpecs, followedSpecMap, jobCountBySpec]);

  // Apply filter
  const filteredSpecs = useMemo(() => {
    return mergedSpecs.filter((spec) => {
      if (filter === "approved") return spec.isApproved;
      if (filter === "not_approved") return !spec.isApproved;
      return true;
    });
  }, [mergedSpecs, filter]);

  const handleApprove = (spec: WorkerJobSpec) => {
    setSelectedSpec(spec);
    setIsModalOpen(true);
  };

  const handleSubmitApproval = async (specId: bigint, minBounty: number) => {
    if (!address) return;

    setIsSubmitting(true);

    const spec = mergedSpecs.find((s) => s.id === specId);
    if (!spec) {
      setIsSubmitting(false);
      return;
    }

    try {
      await followSpec({
        specId: Number(specId),
        walletAddress: address,
        mainDomain: spec.mainDomain,
        minBounty,
        autoClaim: false,
      });
    } catch (error) {
      console.error("Failed to approve spec:", error);
    }

    setIsSubmitting(false);
    setIsModalOpen(false);
    setSelectedSpec(null);
  };

  const handleSpecClick = (specId: bigint) => {
    router.push(`/worker/jobSpecs/${specId.toString()}/jobs`);
  };

  const approvedCount = mergedSpecs.filter((s) => s.isApproved).length;
  const notApprovedCount = mergedSpecs.filter((s) => !s.isApproved).length;
  const isLoading = specsLoading || jobsLoading || followedLoading;

  return (
    <DashboardLayout role="worker">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-[var(--text-primary)] mb-2">
            Browse Job Specs
          </h1>
          <p className="text-[var(--text-secondary)]">
            Approve specs to receive matching jobs
          </p>
        </div>
      </div>

      {/* Extension Warning */}
      {!extensionConnected && (
        <div className="mb-6">
          <ExtensionRequiredCard
            title="Extension Required for Approvals"
            description="You can browse job specs, but you need the extension installed to approve them and start working."
          />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            filter === "all"
              ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
          }`}
        >
          All ({mergedSpecs.length})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            filter === "approved"
              ? "bg-[var(--surface-2)] text-[var(--accent)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
          }`}
        >
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setFilter("not_approved")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            filter === "not_approved"
              ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
          }`}
        >
          Not Approved ({notApprovedCount})
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)]">Loading job specs from blockchain...</p>
        </div>
      )}

      {/* Specs Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpecs.map((spec) => (
            <WorkerJobSpecCard
              key={spec.id.toString()}
              spec={spec}
              onApprove={handleApprove}
              onClick={handleSpecClick}
              extensionConnected={extensionConnected}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredSpecs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)] mb-4">
            {filter === "approved"
              ? "You haven't approved any specs yet."
              : filter === "not_approved"
                ? "You've approved all available specs!"
                : "No job specs found in the ecosystem yet."}
          </p>
          {filter !== "all" && (
            <Button variant="secondary" onClick={() => setFilter("all")}>
              View All Specs
            </Button>
          )}
        </div>
      )}

      {/* Approve Modal */}
      <ApproveSpecModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSpec(null);
        }}
        onSubmit={handleSubmitApproval}
        spec={selectedSpec}
        isSubmitting={isSubmitting}
      />
    </DashboardLayout>
  );
}
