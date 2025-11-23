"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ExtensionStatus, useExtensionStatus } from "@/components/ExtensionStatus";
import { Button } from "@/components/ui";

const steps = [
  {
    number: 1,
    title: "Install the extension",
    description: "Add to Chrome and pin it to your toolbar for easy access.",
  },
  {
    number: 2,
    title: "Connect your wallet",
    description: "Sign in with the same wallet you use on gh0st.market.",
  },
  {
    number: 3,
    title: "Claim jobs from the dashboard",
    description: "When you claim a job, the extension starts automatically.",
  },
  {
    number: 4,
    title: "Watch your agent work",
    description: "The AI navigates, collects data, and generates zk-TLS proofs.",
  },
  {
    number: 5,
    title: "Get paid",
    description: "Once the proof verifies on-chain, payment is released to your wallet.",
  },
];

const requirements = [
  "Chrome browser (v120+)",
  "Connected wallet (same as gh0st.market)",
  "Authorized access to target domains",
];

function ChromeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.85.63-3.55 1.69-4.9L10.31 14H12c1.1 0 2-.9 2-2v-.31l4.9-4.62C20.37 8.45 21 10.15 21 12c0 4.41-3.59 8-9 8zm-1-14c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm3 1c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1z" />
    </svg>
  );
}

export default function ExtensionPage() {
  const router = useRouter();
  const { connected, version } = useExtensionStatus();

  return (
    <DashboardLayout role="worker">
      {/* Back Link */}
      <button
        onClick={() => router.push("/worker")}
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
        Back to Dashboard
      </button>

      {/* Hero Section */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-8 mb-6 text-center">
        {/* Chrome Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center">
          <svg
            className="w-12 h-12 text-[var(--accent)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-3xl font-bold text-[var(--text-primary)] mb-3">
          gh0st.market Extension
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-[var(--text-secondary)] mb-6 max-w-lg mx-auto">
          Your AI agent runs inside this extension to complete data collection jobs with zk-TLS proofs.
        </p>

        {/* Connection Status */}
        {connected ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--success)]/10 border border-[var(--success)]/30 rounded-lg mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
            <span className="text-[var(--success)]">
              Extension Connected {version && `(v${version})`}
            </span>
          </div>
        ) : (
          <Button
            size="lg"
            onClick={() => {
              // TODO: Link to Chrome Web Store
              window.open("https://chrome.google.com/webstore", "_blank");
            }}
            className="mb-6"
          >
            <ChromeIcon className="w-5 h-5 mr-2" />
            Download for Chrome
          </Button>
        )}
      </div>

      {/* How it Works */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 mb-6">
        <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-xl font-bold text-[var(--text-primary)] mb-6">
          How it works
        </h2>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex gap-4">
              {/* Step Number */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center">
                <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm font-medium text-[var(--text-primary)]">
                  {step.number}
                </span>
              </div>

              {/* Step Content */}
              <div className="flex-1 pb-6 border-b border-[var(--border)] last:border-b-0 last:pb-0">
                <h3 className="text-base font-medium text-[var(--text-primary)] mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-xl font-bold text-[var(--text-primary)] mb-4">
          Requirements
        </h2>

        <ul className="space-y-3">
          {requirements.map((req, index) => (
            <li key={index} className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-[var(--accent)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-[var(--text-secondary)]">{req}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Dev Mode Toggle (for testing) */}
      <div className="mt-6 p-4 bg-[var(--background)] border border-dashed border-[var(--border)] rounded-lg">
        <p className="text-xs text-[var(--text-muted)] mb-2">Development only:</p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const current = localStorage.getItem("gh0st_extension_mock") === "true";
            localStorage.setItem("gh0st_extension_mock", (!current).toString());
            window.location.reload();
          }}
        >
          Toggle Mock Extension ({connected ? "ON" : "OFF"})
        </Button>
      </div>
    </DashboardLayout>
  );
}
