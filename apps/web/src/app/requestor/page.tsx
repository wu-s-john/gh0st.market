"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { DashboardLayout } from "@/components/DashboardLayout";
import { JobsTable, Job } from "@/components/tables/JobsTable";
import { JobSpecsTable, JobSpec } from "@/components/tables/JobSpecsTable";
import { CreateSpecModal, CreateJobSpecParams } from "@/components/modals/CreateSpecModal";
import { Button } from "@/components/ui";
import { useUserJobSpecs, useUserJobs } from "@/hooks/useJobRegistry";
import { useCreateJobSpec } from "@/hooks/useJobRegistryWrite";
import { useTransactionToast } from "@/hooks/useTransactionToast";
import { formatJobForUI, formatJobSpecForUI } from "@/lib/formatters";

export default function RequestorDashboard() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isCreateSpecModalOpen, setIsCreateSpecModalOpen] = useState(false);

  // Fetch user's job specs and jobs from blockchain
  const {
    data: userSpecs,
    isLoading: isLoadingSpecs,
    refetch: refetchSpecs,
  } = useUserJobSpecs(address);

  const {
    data: userJobs,
    isLoading: isLoadingJobs,
    refetch: refetchJobs,
  } = useUserJobs(address);

  // Create job spec hook
  const {
    createJobSpec,
    isPending: isCreatingSpec,
    isConfirming: isConfirmingSpec,
    isSuccess: isSpecCreated,
    error: createSpecError,
  } = useCreateJobSpec();

  // Transaction toast notifications
  useTransactionToast(
    { isPending: isCreatingSpec, isConfirming: isConfirmingSpec, isSuccess: isSpecCreated, error: createSpecError },
    { successMessage: "Job spec created!" }
  );

  // Refetch data when spec is created successfully
  useEffect(() => {
    if (isSpecCreated) {
      refetchSpecs();
      setIsCreateSpecModalOpen(false);
    }
  }, [isSpecCreated, refetchSpecs]);

  // Transform blockchain data to UI format
  const formattedJobs: Job[] = useMemo(() => {
    if (!userJobs || !userSpecs) return [];

    // Create a map of specId -> mainDomain for quick lookup
    const specDomainMap = new Map<string, string>();
    userSpecs.forEach((spec) => {
      specDomainMap.set(spec.id.toString(), spec.mainDomain);
    });

    return userJobs.map((job) => {
      const mainDomain = specDomainMap.get(job.specId.toString());
      return formatJobForUI(job, mainDomain);
    });
  }, [userJobs, userSpecs]);

  const formattedSpecs: JobSpec[] = useMemo(() => {
    if (!userSpecs || !userJobs) return [];

    // Count jobs per spec
    const jobCountMap = new Map<string, number>();
    userJobs.forEach((job) => {
      const specId = job.specId.toString();
      jobCountMap.set(specId, (jobCountMap.get(specId) || 0) + 1);
    });

    return userSpecs.map((spec) => {
      const jobCount = jobCountMap.get(spec.id.toString()) || 0;
      return formatJobSpecForUI(spec, jobCount);
    });
  }, [userSpecs, userJobs]);

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

  const handleJobClick = (jobId: string) => {
    // TODO: Navigate to job details
    console.log("Job clicked:", jobId);
  };

  const handleSpecClick = (specId: string) => {
    router.push(`/requestor/jobSpecs/${specId}/jobs`);
  };

  const isLoading = isLoadingSpecs || isLoadingJobs;
  const isSubmitting = isCreatingSpec || isConfirmingSpec;

  // Show connect wallet message if not connected
  if (!isConnected) {
    return (
      <DashboardLayout role="requestor">
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-[var(--text-secondary)] text-center max-w-md">
            Connect your wallet to view and manage your jobs and job specs.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="requestor">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-[var(--text-primary)] mb-2">
          Dashboard
        </h1>
        <p className="text-[var(--text-secondary)]">
          Manage your jobs and job specs
        </p>
      </div>

      {/* Content Grid */}
      <div className="space-y-6">
        {/* Your Jobs Section */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-semibold text-[var(--text-primary)]">
              Your Jobs
            </h2>
          </div>
          <div className="p-2">
            {isLoading ? (
              <div className="py-8 text-center text-[var(--text-muted)]">
                Loading jobs...
              </div>
            ) : (
              <JobsTable
                jobs={formattedJobs}
                onRowClick={handleJobClick}
                emptyMessage="You haven't created any jobs yet"
              />
            )}
          </div>
          {formattedJobs.length > 0 && (
            <div className="px-6 py-3 border-t border-[var(--border)]">
              <button className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                View All Jobs →
              </button>
            </div>
          )}
        </div>

        {/* Your Job Specs Section */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-semibold text-[var(--text-primary)]">
              Your Job Specs
            </h2>
            <Button size="sm" onClick={() => setIsCreateSpecModalOpen(true)}>
              + Create Spec
            </Button>
          </div>
          <div className="p-2">
            {isLoading ? (
              <div className="py-8 text-center text-[var(--text-muted)]">
                Loading specs...
              </div>
            ) : (
              <JobSpecsTable
                specs={formattedSpecs}
                onRowClick={handleSpecClick}
                emptyMessage="You haven't created any job specs yet"
              />
            )}
          </div>
          {formattedSpecs.length > 0 && (
            <div className="px-6 py-3 border-t border-[var(--border)]">
              <button
                onClick={() => router.push("/requestor/jobSpecs")}
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
              >
                Browse All Specs →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Spec Modal */}
      <CreateSpecModal
        isOpen={isCreateSpecModalOpen}
        onClose={() => setIsCreateSpecModalOpen(false)}
        onSubmit={handleCreateSpec}
        isSubmitting={isSubmitting}
      />
    </DashboardLayout>
  );
}
