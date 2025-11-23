"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import JsonView from "@uiw/react-json-view";
import { darkTheme } from "@uiw/react-json-view/dark";
import { DashboardLayout } from "@/components/DashboardLayout";
import { JobsTable, Job } from "@/components/tables/JobsTable";
import { CreateJobModal, CreateJobParams } from "@/components/modals/CreateJobModal";
import { Button } from "@/components/ui";

// Extended spec type with full details
interface FullJobSpec {
  id: string;
  mainDomain: string;
  notarizeUrl: string;
  description: string;
  promptInstructions: string;
  inputSchema: string;
  outputSchema: string;
  validationRules: string;
  creator: string;
  createdAt: number;
  active: boolean;
  jobCount: number;
}

// Mock data
const mockSpecDetails: Record<string, FullJobSpec> = {
  "1": {
    id: "1",
    mainDomain: "crunchbase.com",
    notarizeUrl: "https://crunchbase.com/organization/{{orgSlug}}",
    description: "Fetch Crunchbase organization profiles with funding and employee data",
    promptInstructions: "Navigate to the organization page. Extract the company name from the header. Find the funding total in the Financials section. Get employee count from the About section. The data should be current and reflect the latest information available on the profile.",
    inputSchema: JSON.stringify({ orgSlug: "string" }, null, 2),
    outputSchema: JSON.stringify({
      name: "string",
      description: "string",
      funding: "number",
      employees: "number",
      founded: "string",
      headquarters: "string",
    }, null, 2),
    validationRules: "Output must contain valid JSON matching the output schema. All required fields must be present. Funding amount should be in USD.",
    creator: "0x7f3a8b2c9d4e5f6a1b2c3d4e5f6a7b8c",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    active: true,
    jobCount: 47,
  },
};

const mockJobsForSpec: Record<string, Job[]> = {
  "1": [
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
      specId: "1",
      targetDomain: "crunchbase.com",
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
  ],
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

  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get spec details (mock)
  const spec = mockSpecDetails[specId] || mockSpecDetails["1"];
  const jobs = mockJobsForSpec[specId] || mockJobsForSpec["1"];

  const handleCreateJob = async (params: CreateJobParams) => {
    setIsSubmitting(true);
    console.log("Creating job:", params);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsCreateJobModalOpen(false);
  };

  // Parse JSON schemas for display
  let inputSchemaObj = {};
  let outputSchemaObj = {};
  try {
    inputSchemaObj = JSON.parse(spec.inputSchema);
    outputSchemaObj = JSON.parse(spec.outputSchema);
  } catch {
    // Keep empty objects if parsing fails
  }

  // Convert to JobSpec type for modal
  const specForModal = {
    id: spec.id,
    mainDomain: spec.mainDomain,
    notarizeUrl: spec.notarizeUrl,
    description: spec.description,
    promptInstructions: spec.promptInstructions,
    creator: spec.creator,
    createdAt: spec.createdAt,
    active: spec.active,
    jobCount: spec.jobCount,
  };

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
              {spec.mainDomain}
            </h1>
            <p className="text-[var(--text-secondary)] mb-2">
              {spec.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
              <span>Created by: {truncateAddress(spec.creator)}</span>
              <span>Created: {formatDate(spec.createdAt)}</span>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-sm ${
              spec.active ? "text-[var(--success)]" : "text-[var(--text-muted)]"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            {spec.active ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Notarize URL */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
            Notarize URL
          </h3>
          <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-md">
            <code className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--info)]">
              {spec.notarizeUrl}
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
              {spec.promptInstructions}
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
        {spec.validationRules && (
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
              Validation Rules
            </h3>
            <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-md">
              <p className="text-[var(--text-secondary)] text-sm">
                {spec.validationRules}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Jobs Section */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-semibold text-[var(--text-primary)]">
            Jobs ({jobs.length})
          </h2>
          <Button size="sm" onClick={() => setIsCreateJobModalOpen(true)}>
            + Create Job
          </Button>
        </div>
        <div className="p-2">
          <JobsTable
            jobs={jobs}
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
