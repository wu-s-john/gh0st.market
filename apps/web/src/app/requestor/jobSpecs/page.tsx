"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { parseEther } from "viem";
import { DashboardLayout } from "@/components/DashboardLayout";
import { JobSpecCard } from "@/components/cards/JobSpecCard";
import { JobSpec } from "@/components/tables/JobSpecsTable";
import { CreateSpecModal, CreateJobSpecParams } from "@/components/modals/CreateSpecModal";
import { CreateJobModal, CreateJobParams } from "@/components/modals/CreateJobModal";
import { Button } from "@/components/ui";
import { useAllJobSpecs } from "@/hooks/useJobRegistry";
import { useCreateJobSpec, useCreateJob } from "@/hooks/useJobRegistryWrite";
import { useTransactionToast } from "@/hooks/useTransactionToast";
import { formatJobSpecForUI } from "@/lib/formatters";

// Token symbol to address mapping
const TOKEN_ADDRESSES: Record<string, `0x${string}`> = {
  ETH: "0x0000000000000000000000000000000000000000",
  // Add more tokens as needed (USDC, etc.)
  USDC: "0x0000000000000000000000000000000000000000", // TODO: Add real USDC address
};

export default function BrowseSpecsPage() {
  const router = useRouter();
  const [isCreateSpecModalOpen, setIsCreateSpecModalOpen] = useState(false);
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<JobSpec | null>(null);

  // Fetch all specs from blockchain
  const {
    data: allSpecs,
    isLoading: isLoadingSpecs,
    refetch: refetchSpecs,
  } = useAllJobSpecs();

  // Create spec hook
  const {
    createJobSpec,
    isPending: isCreatingSpec,
    isConfirming: isConfirmingSpec,
    isSuccess: isSpecCreated,
    error: createSpecError,
  } = useCreateJobSpec();

  // Create job hook
  const {
    createJob,
    isPending: isCreatingJob,
    isConfirming: isConfirmingJob,
    isSuccess: isJobCreated,
    error: createJobError,
  } = useCreateJob();

  // Transaction toast notifications
  useTransactionToast(
    { isPending: isCreatingSpec, isConfirming: isConfirmingSpec, isSuccess: isSpecCreated, error: createSpecError },
    { successMessage: "Job spec created!" }
  );
  useTransactionToast(
    { isPending: isCreatingJob, isConfirming: isConfirmingJob, isSuccess: isJobCreated, error: createJobError },
    { successMessage: "Job created!" }
  );

  // Refetch when spec is created
  useEffect(() => {
    if (isSpecCreated) {
      refetchSpecs();
      setIsCreateSpecModalOpen(false);
    }
  }, [isSpecCreated, refetchSpecs]);

  // Close job modal when job is created
  useEffect(() => {
    if (isJobCreated) {
      setIsCreateJobModalOpen(false);
      setSelectedSpec(null);
    }
  }, [isJobCreated]);

  // Transform blockchain data to UI format
  const formattedSpecs: JobSpec[] = useMemo(() => {
    if (!allSpecs) return [];
    // TODO: Get job counts per spec from events
    return allSpecs.map((spec) => formatJobSpecForUI(spec, 0));
  }, [allSpecs]);

  const handleCreateSpec = async (params: CreateJobSpecParams) => {
    createJobSpec({
      mainDomain: params.mainDomain,
      notarizeUrl: params.notarizeUrl,
      description: params.description,
      promptInstructions: params.promptInstructions,
      outputSchema: params.outputSchema || "",
      inputSchema: params.inputSchema || "",
      validationRules: params.validationRules || "",
    });
  };

  const handleCreateJob = async (params: CreateJobParams) => {
    const tokenAddress = TOKEN_ADDRESSES[params.token] || TOKEN_ADDRESSES.ETH;
    const bountyWei = parseEther(params.bounty);

    createJob({
      specId: BigInt(params.specId),
      inputs: params.inputs,
      token: tokenAddress,
      bounty: bountyWei,
      requesterContact: params.requesterContact || "",
    });
  };

  const handleUseSpec = (spec: JobSpec) => {
    setSelectedSpec(spec);
    setIsCreateJobModalOpen(true);
  };

  const handleSpecClick = (specId: string) => {
    router.push(`/requestor/jobSpecs/${specId}/jobs`);
  };

  const isSubmittingSpec = isCreatingSpec || isConfirmingSpec;
  const isSubmittingJob = isCreatingJob || isConfirmingJob;

  return (
    <DashboardLayout role="requestor">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-[var(--text-primary)] mb-2">
            Browse Job Specs
          </h1>
          <p className="text-[var(--text-secondary)]">
            Find and reuse existing specs from the ecosystem
          </p>
        </div>
        <Button onClick={() => setIsCreateSpecModalOpen(true)}>
          + Create Spec
        </Button>
      </div>

      {/* Loading State */}
      {isLoadingSpecs && (
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)]">Loading specs...</p>
        </div>
      )}

      {/* Specs Grid */}
      {!isLoadingSpecs && formattedSpecs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {formattedSpecs.map((spec) => (
            <JobSpecCard
              key={spec.id}
              spec={spec}
              onUseSpec={handleUseSpec}
              onClick={handleSpecClick}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingSpecs && formattedSpecs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)] mb-4">
            No job specs found in the ecosystem yet.
          </p>
          <Button onClick={() => setIsCreateSpecModalOpen(true)}>
            Create the First Spec
          </Button>
        </div>
      )}

      {/* Create Spec Modal */}
      <CreateSpecModal
        isOpen={isCreateSpecModalOpen}
        onClose={() => setIsCreateSpecModalOpen(false)}
        onSubmit={handleCreateSpec}
        isSubmitting={isSubmittingSpec}
      />

      {/* Create Job Modal */}
      <CreateJobModal
        isOpen={isCreateJobModalOpen}
        onClose={() => {
          setIsCreateJobModalOpen(false);
          setSelectedSpec(null);
        }}
        onSubmit={handleCreateJob}
        spec={selectedSpec}
        isSubmitting={isSubmittingJob}
      />
    </DashboardLayout>
  );
}
