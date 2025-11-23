"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { parseEther } from "viem";
import JsonView from "@uiw/react-json-view";
import { darkTheme } from "@uiw/react-json-view/dark";
import { DashboardLayout } from "@/components/DashboardLayout";
import { JobsTable, Job } from "@/components/tables/JobsTable";
import { CreateJobModal, CreateJobParams } from "@/components/modals/CreateJobModal";
import { Button } from "@/components/ui";
import { useJobSpec, useJobsForSpec } from "@/hooks/useJobRegistry";
import { useCreateJob } from "@/hooks/useJobRegistryWrite";
import { useTransactionToast } from "@/hooks/useTransactionToast";
import { formatJobForUI } from "@/lib/formatters";

// Token symbol to address mapping
const TOKEN_ADDRESSES: Record<string, `0x${string}`> = {
  ETH: "0x0000000000000000000000000000000000000000",
  USDC: "0x0000000000000000000000000000000000000000", // TODO: Add real USDC address
};

function truncateAddress(address: string): string {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Custom theme for JSON viewer matching gh0st.market colors
const ghostTheme = {
  ...darkTheme,
  '--w-rjv-background-color': 'var(--background)',
  '--w-rjv-border-left': '1px solid var(--border)',
  '--w-rjv-color': 'var(--text-secondary)',
  '--w-rjv-key-string': 'var(--text-primary)',
  '--w-rjv-type-string-color': 'var(--info)',
  '--w-rjv-type-int-color': 'var(--success)',
  '--w-rjv-type-float-color': 'var(--success)',
  '--w-rjv-type-boolean-color': 'var(--warning)',
  '--w-rjv-curlybraces-color': 'var(--text-muted)',
  '--w-rjv-brackets-color': 'var(--text-muted)',
};

export default function SpecDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const specId = params.specId as string;
  const specIdBigInt = BigInt(specId);

  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);

  // Fetch spec and jobs from blockchain
  const {
    data: specData,
    isLoading: isLoadingSpec,
  } = useJobSpec(specIdBigInt);

  const {
    data: jobsData,
    isLoading: isLoadingJobs,
    refetch: refetchJobs,
  } = useJobsForSpec(specIdBigInt);

  // Create job hook
  const {
    createJob,
    isPending: isCreatingJob,
    isConfirming: isConfirmingJob,
    isSuccess: isJobCreated,
    error: createJobError,
  } = useCreateJob();

  // Transaction toast notification
  useTransactionToast(
    { isPending: isCreatingJob, isConfirming: isConfirmingJob, isSuccess: isJobCreated, error: createJobError },
    { successMessage: "Job created!" }
  );

  // Refetch jobs when a new job is created
  useEffect(() => {
    if (isJobCreated) {
      refetchJobs();
      setIsCreateJobModalOpen(false);
    }
  }, [isJobCreated, refetchJobs]);

  // Transform jobs data for UI
  const formattedJobs: Job[] = useMemo(() => {
    if (!jobsData || !specData) return [];
    return jobsData.map((job) => formatJobForUI(job, specData.mainDomain));
  }, [jobsData, specData]);

  const handleCreateJob = async (jobParams: CreateJobParams) => {
    const tokenAddress = TOKEN_ADDRESSES[jobParams.token] || TOKEN_ADDRESSES.ETH;
    const bountyWei = parseEther(jobParams.bounty);

    createJob({
      specId: specIdBigInt,
      inputs: jobParams.inputs,
      token: tokenAddress,
      bounty: bountyWei,
      requesterContact: jobParams.requesterContact || "",
    });
  };

  // Parse JSON schemas for display
  let inputSchemaObj = {};
  let outputSchemaObj = {};
  if (specData) {
    try {
      inputSchemaObj = JSON.parse(specData.inputSchema);
    } catch {
      // Keep empty object if parsing fails
    }
    try {
      outputSchemaObj = JSON.parse(specData.outputSchema);
    } catch {
      // Keep empty object if parsing fails
    }
  }

  const isLoading = isLoadingSpec || isLoadingJobs;
  const isSubmitting = isCreatingJob || isConfirmingJob;

  // Convert to JobSpec type for modal
  const specForModal = specData ? {
    id: specId,
    mainDomain: specData.mainDomain,
    notarizeUrl: specData.notarizeUrl,
    description: specData.description,
    promptInstructions: specData.promptInstructions,
    inputSchema: specData.inputSchema,
    outputSchema: specData.outputSchema,
    creator: specData.creator,
    createdAt: Number(specData.createdAt) * 1000,
    active: specData.active,
    jobCount: formattedJobs.length,
  } : null;

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout role="requestor">
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)]">Loading spec details...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Not found state
  if (!specData) {
    return (
      <DashboardLayout role="requestor">
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)]">Spec not found</p>
          <button
            onClick={() => router.push("/requestor/jobSpecs")}
            className="mt-4 text-[var(--accent)] hover:text-[var(--accent-hover)]"
          >
            Back to Browse Specs
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="requestor">
      {/* Back Link */}
      <button
        onClick={() => router.push("/requestor/jobSpecs")}
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
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-[var(--text-primary)] mb-2">
              {specData.mainDomain}
            </h1>
            <p className="text-[var(--text-secondary)] mb-2">
              {specData.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
              <span>Created by: {truncateAddress(specData.creator)}</span>
              <span>Created: {formatDate(Number(specData.createdAt) * 1000)}</span>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-sm ${
              specData.active ? "text-[var(--success)]" : "text-[var(--text-muted)]"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            {specData.active ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Notarize URL */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
            Notarize URL
          </h3>
          <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-md">
            <code className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--info)]">
              {specData.notarizeUrl}
            </code>
          </div>
        </div>

        {/* Prompt Instructions */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
            Prompt Instructions
          </h3>
          <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-md">
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {specData.promptInstructions}
            </p>
          </div>
        </div>

        {/* Schemas */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Input Schema */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
              Input Schema
            </h3>
            <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-md overflow-auto">
              <JsonView
                value={inputSchemaObj}
                style={ghostTheme}
                displayDataTypes={false}
                displayObjectSize={false}
              />
            </div>
          </div>

          {/* Output Schema */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
              Output Schema
            </h3>
            <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-md overflow-auto">
              <JsonView
                value={outputSchemaObj}
                style={ghostTheme}
                displayDataTypes={false}
                displayObjectSize={false}
              />
            </div>
          </div>
        </div>

        {/* Validation Rules */}
        {specData.validationRules && (
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
              Validation Rules
            </h3>
            <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">
                {specData.validationRules}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Jobs Section */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-semibold text-[var(--text-primary)]">
            Jobs ({formattedJobs.length})
          </h2>
          <Button size="sm" onClick={() => setIsCreateJobModalOpen(true)}>
            + Create Job
          </Button>
        </div>
        <div className="p-2">
          <JobsTable
            jobs={formattedJobs}
            emptyMessage="No jobs created for this spec yet"
          />
        </div>
      </div>

      {/* Create Job Modal */}
      <CreateJobModal
        isOpen={isCreateJobModalOpen}
        onClose={() => setIsCreateJobModalOpen(false)}
        onSubmit={handleCreateJob}
        spec={specForModal}
        isSubmitting={isSubmitting}
      />
    </DashboardLayout>
  );
}
