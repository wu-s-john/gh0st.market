"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui";

// Worker-specific spec type with approval status
interface WorkerJobSpec {
  id: string;
  mainDomain: string;
  notarizeUrl: string;
  description: string;
  creator: string;
  createdAt: number;
  active: boolean;
  jobCount: number;
  // Worker-specific fields
  isApproved: boolean;
  minPrice?: string;
  token?: string;
}

type FilterType = "all" | "approved" | "not_approved";

// Mock data - all specs in the ecosystem with approval status
const mockAllSpecs: WorkerJobSpec[] = [
  {
    id: "1",
    mainDomain: "crunchbase.com",
    notarizeUrl: "https://crunchbase.com/organization/{{orgSlug}}",
    description: "Fetch Crunchbase organization profiles with funding and employee data",
    creator: "0x7f3a8b2c9d4e5f6a",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    active: true,
    jobCount: 47,
    isApproved: true,
    minPrice: "0.25",
    token: "USDC",
  },
  {
    id: "2",
    mainDomain: "linkedin.com",
    notarizeUrl: "https://linkedin.com/company/{{companySlug}}",
    description: "Get LinkedIn company profiles with employee count and headquarters",
    creator: "0x2b1c3d4e5f6a7b8c",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    active: true,
    jobCount: 23,
    isApproved: true,
    minPrice: "0.50",
    token: "USDC",
  },
  {
    id: "3",
    mainDomain: "salesforce.com",
    notarizeUrl: "https://{{instance}}.salesforce.com/lightning/o/Dashboard/{{dashboardId}}",
    description: "Extract Salesforce dashboard metrics and chart data",
    creator: "0x9c4d5e6f7a8b9c0d",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    active: true,
    jobCount: 12,
    isApproved: false,
  },
  {
    id: "4",
    mainDomain: "github.com",
    notarizeUrl: "https://github.com/{{owner}}/{{repo}}",
    description: "Fetch GitHub repository stats including stars, forks, and contributors",
    creator: "0x1a2b3c4d5e6f7a8b",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    active: true,
    jobCount: 8,
    isApproved: true,
    minPrice: "0.10",
    token: "USDC",
  },
  {
    id: "5",
    mainDomain: "pitchbook.com",
    notarizeUrl: "https://pitchbook.com/profiles/company/{{companyId}}",
    description: "Retrieve PitchBook company valuation and funding data",
    creator: "0x3c4d5e6f7a8b9c0d",
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    active: false,
    jobCount: 3,
    isApproved: false,
  },
];

function ApprovalStatusBadge({ isApproved, minPrice, token }: { isApproved: boolean; minPrice?: string; token?: string }) {
  if (isApproved) {
    return (
      <div className="flex flex-col">
        <span className="inline-flex items-center gap-1.5 text-[var(--success)]">
          <span className="w-2 h-2 rounded-full bg-current" />
          Approved
        </span>
        {minPrice && (
          <span className="text-xs text-[var(--text-muted)] mt-0.5">
            Min: {minPrice} {token}
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
}: {
  spec: WorkerJobSpec;
  onApprove: (spec: WorkerJobSpec) => void;
  onClick: (specId: string) => void;
}) {
  return (
    <div
      className={`
        bg-[var(--surface)] border rounded-lg p-5 transition-all duration-150
        ${spec.isApproved
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
        <ApprovalStatusBadge
          isApproved={spec.isApproved}
          minPrice={spec.minPrice}
          token={spec.token}
        />
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
        {spec.description}
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
            <Button
              size="sm"
              onClick={() => onClick(spec.id)}
              className="flex-1"
            >
              View Jobs
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onApprove(spec)}
            >
              Edit
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={() => onApprove(spec)}
            className="flex-1"
          >
            Approve
          </Button>
        )}
      </div>
    </div>
  );
}

// ApproveSpecModal inline for now
function ApproveSpecModal({
  isOpen,
  onClose,
  onSubmit,
  spec,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (specId: string, minPrice: string) => void;
  spec: WorkerJobSpec | null;
  isSubmitting: boolean;
}) {
  const [minPrice, setMinPrice] = useState(spec?.minPrice || "0.25");

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
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            {spec.description}
          </p>

          <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-md mb-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Notarize URL:</p>
            <code className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-[var(--info)] break-all">
              {spec.notarizeUrl}
            </code>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            By approving, you confirm you have authorized access to {spec.mainDomain} and can complete these data collection jobs.
          </p>
        </div>

        {/* Min Price Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Minimum bounty you&apos;ll accept
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-[var(--text-primary)] font-[family-name:var(--font-jetbrains-mono)] focus:outline-none focus:border-[var(--accent)]"
              placeholder="0.25"
            />
            <span className="text-sm text-[var(--text-muted)]">USDC</span>
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
            onClick={() => onSubmit(spec.id, minPrice)}
            disabled={isSubmitting || !minPrice}
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
  const [filter, setFilter] = useState<FilterType>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<WorkerJobSpec | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredSpecs = mockAllSpecs.filter((spec) => {
    if (filter === "approved") return spec.isApproved;
    if (filter === "not_approved") return !spec.isApproved;
    return true;
  });

  const handleApprove = (spec: WorkerJobSpec) => {
    setSelectedSpec(spec);
    setIsModalOpen(true);
  };

  const handleSubmitApproval = async (specId: string, minPrice: string) => {
    setIsSubmitting(true);
    console.log("Approving spec:", specId, "with min price:", minPrice);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsModalOpen(false);
    setSelectedSpec(null);
  };

  const handleSpecClick = (specId: string) => {
    router.push(`/worker/jobSpecs/${specId}/jobs`);
  };

  const approvedCount = mockAllSpecs.filter((s) => s.isApproved).length;
  const notApprovedCount = mockAllSpecs.filter((s) => !s.isApproved).length;

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
          All ({mockAllSpecs.length})
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

      {/* Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSpecs.map((spec) => (
          <WorkerJobSpecCard
            key={spec.id}
            spec={spec}
            onApprove={handleApprove}
            onClick={handleSpecClick}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredSpecs.length === 0 && (
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
