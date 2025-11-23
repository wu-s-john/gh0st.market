"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { JobsTable, Job } from "@/components/tables/JobsTable";
import { JobSpecsTable, JobSpec } from "@/components/tables/JobSpecsTable";
import { CreateSpecModal, CreateJobSpecParams } from "@/components/modals/CreateSpecModal";
import { Button } from "@/components/ui";

// Mock data for development
const mockJobs: Job[] = [
  {
    id: "0x7f3a8b2c9d4e5f6a1b2c3d4e5f6a7b8c",
    specId: "1",
    targetDomain: "crunchbase.com",
    status: "Open",
    bounty: "0.50",
    token: "USDC",
    createdAt: Date.now() - 1000 * 60 * 5,
  },
  {
    id: "0x2b1c3d4e5f6a7b8c9d0e1f2a3b4c5d6e",
    specId: "2",
    targetDomain: "linkedin.com",
    status: "Completed",
    bounty: "1.20",
    token: "USDC",
    createdAt: Date.now() - 1000 * 60 * 60,
  },
  {
    id: "0x9c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
    specId: "1",
    targetDomain: "crunchbase.com",
    status: "Open",
    bounty: "2.00",
    token: "ETH",
    createdAt: Date.now() - 1000 * 60 * 120,
  },
];

const mockSpecs: JobSpec[] = [
  {
    id: "1",
    mainDomain: "crunchbase.com",
    notarizeUrl: "https://crunchbase.com/organization/{{orgSlug}}",
    description: "Fetch Crunchbase organization profiles with funding and employee data",
    promptInstructions: "Navigate to the organization page. Extract the company name from the header. Find the funding total in the Financials section. Get employee count from the About section.",
    creator: "0x7f3a8b2c9d4e5f6a",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    active: true,
    jobCount: 12,
  },
  {
    id: "2",
    mainDomain: "linkedin.com",
    notarizeUrl: "https://linkedin.com/company/{{companySlug}}",
    description: "Get LinkedIn company profiles with employee count and headquarters",
    promptInstructions: "Navigate to the company page. Extract employee count, headquarters location, industry, and recent posts from the company profile.",
    creator: "0x7f3a8b2c9d4e5f6a",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    active: true,
    jobCount: 5,
  },
  {
    id: "3",
    mainDomain: "salesforce.com",
    notarizeUrl: "https://{{instance}}.salesforce.com/lightning/o/Dashboard/{{dashboardId}}",
    description: "Extract Salesforce dashboard metrics and chart data",
    promptInstructions: "Login to the Salesforce instance. Navigate to the dashboard URL and capture all visible metrics and charts data.",
    creator: "0x7f3a8b2c9d4e5f6a",
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    active: false,
    jobCount: 0,
  },
];

export default function RequestorDashboard() {
  const router = useRouter();
  const [isCreateSpecModalOpen, setIsCreateSpecModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSpec = async (params: CreateJobSpecParams) => {
    setIsSubmitting(true);
    // TODO: Call contract to create spec
    console.log("Creating spec:", params);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsCreateSpecModalOpen(false);
  };

  const handleJobClick = (jobId: string) => {
    // TODO: Navigate to job details or expand inline
    console.log("Job clicked:", jobId);
  };

  const handleSpecClick = (specId: string) => {
    router.push(`/requestor/jobSpecs/${specId}/jobs`);
  };

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
            <JobsTable
              jobs={mockJobs}
              onRowClick={handleJobClick}
              emptyMessage="You haven't created any jobs yet"
            />
          </div>
          {mockJobs.length > 0 && (
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
            <JobSpecsTable
              specs={mockSpecs}
              onRowClick={handleSpecClick}
              emptyMessage="You haven't created any job specs yet"
            />
          </div>
          {mockSpecs.length > 0 && (
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
