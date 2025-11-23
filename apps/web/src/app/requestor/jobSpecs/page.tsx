"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { JobSpecCard } from "@/components/cards/JobSpecCard";
import { JobSpec } from "@/components/tables/JobSpecsTable";
import { CreateSpecModal, CreateJobSpecParams } from "@/components/modals/CreateSpecModal";
import { CreateJobModal, CreateJobParams } from "@/components/modals/CreateJobModal";
import { Button } from "@/components/ui";

// Mock data - all specs in the ecosystem
const mockAllSpecs: JobSpec[] = [
  {
    id: "1",
    mainDomain: "crunchbase.com",
    notarizeUrl: "https://crunchbase.com/organization/{{orgSlug}}",
    description: "Fetch Crunchbase organization profiles with funding and employee data",
    promptInstructions: "Navigate to the organization page. Extract the company name from the header. Find the funding total in the Financials section. Get employee count from the About section. Return all fields as specified in the output schema.",
    creator: "0x7f3a8b2c9d4e5f6a",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    active: true,
    jobCount: 47,
  },
  {
    id: "2",
    mainDomain: "linkedin.com",
    notarizeUrl: "https://linkedin.com/company/{{companySlug}}",
    description: "Get LinkedIn company profiles with employee count and headquarters",
    promptInstructions: "Navigate to the company page. Extract employee count, headquarters location, industry, and recent posts from the company profile. Ensure all data is current.",
    creator: "0x2b1c3d4e5f6a7b8c",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    active: true,
    jobCount: 23,
  },
  {
    id: "3",
    mainDomain: "salesforce.com",
    notarizeUrl: "https://{{instance}}.salesforce.com/lightning/o/Dashboard/{{dashboardId}}",
    description: "Extract Salesforce dashboard metrics and chart data",
    promptInstructions: "Login to the Salesforce instance. Navigate to the dashboard URL and capture all visible metrics and charts data. Handle authentication if required.",
    creator: "0x9c4d5e6f7a8b9c0d",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    active: true,
    jobCount: 12,
  },
  {
    id: "4",
    mainDomain: "github.com",
    notarizeUrl: "https://github.com/{{owner}}/{{repo}}",
    description: "Fetch GitHub repository stats including stars, forks, and contributors",
    promptInstructions: "Navigate to the repository page. Extract stars, forks, contributors count, and recent commit activity. Also extract README content and repository metadata.",
    creator: "0x1a2b3c4d5e6f7a8b",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    active: true,
    jobCount: 8,
  },
  {
    id: "5",
    mainDomain: "pitchbook.com",
    notarizeUrl: "https://pitchbook.com/profiles/company/{{companyId}}",
    description: "Retrieve PitchBook company valuation and funding data",
    promptInstructions: "Navigate to the company profile. Extract valuation data, funding rounds, and investor information. Requires authenticated session.",
    creator: "0x3c4d5e6f7a8b9c0d",
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    active: false,
    jobCount: 3,
  },
];

export default function BrowseSpecsPage() {
  const router = useRouter();
  const [isCreateSpecModalOpen, setIsCreateSpecModalOpen] = useState(false);
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<JobSpec | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSpec = async (params: CreateJobSpecParams) => {
    setIsSubmitting(true);
    console.log("Creating spec:", params);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsCreateSpecModalOpen(false);
  };

  const handleCreateJob = async (params: CreateJobParams) => {
    setIsSubmitting(true);
    console.log("Creating job:", params);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsCreateJobModalOpen(false);
    setSelectedSpec(null);
  };

  const handleUseSpec = (spec: JobSpec) => {
    setSelectedSpec(spec);
    setIsCreateJobModalOpen(true);
  };

  const handleSpecClick = (specId: string) => {
    router.push(`/requestor/jobSpecs/${specId}/jobs`);
  };

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

      {/* Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockAllSpecs.map((spec) => (
          <JobSpecCard
            key={spec.id}
            spec={spec}
            onUseSpec={handleUseSpec}
            onClick={handleSpecClick}
          />
        ))}
      </div>

      {/* Empty State */}
      {mockAllSpecs.length === 0 && (
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
        isSubmitting={isSubmitting}
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
        isSubmitting={isSubmitting}
      />
    </DashboardLayout>
  );
}
