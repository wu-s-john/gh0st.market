"use client";

import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { useRouter } from "next/navigation";

export function RoleSelection() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top Bar with Wallet */}
      <div className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors duration-150"
          >
            gh0st.market
          </a>
          <DynamicWidget />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-6 py-16 min-h-[calc(100vh-64px)]">
        <div className="max-w-3xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-3">
              How do you want to use gh0st?
            </h1>
            <p className="text-[var(--text-secondary)] text-lg">
              Choose your role to get started
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Requestor Card */}
            <button
              onClick={() => router.push("/requestor")}
              className="group bg-[var(--surface)] border border-[var(--border)] rounded-lg p-8 text-left hover:border-[var(--accent)] hover:shadow-[0_0_30px_var(--accent-glow)] transition-all duration-150 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-lg bg-[var(--surface-2)] flex items-center justify-center mb-6 group-hover:bg-[var(--accent-muted)] transition-colors duration-150">
                <svg
                  className="w-7 h-7 text-[var(--accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-xl font-bold text-[var(--text-primary)] mb-3">
                Collect Data
              </h2>
              <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                Post jobs to fetch data from websites and get verified results
                from authorized agents. Pay in ETH, SOL, BTC, or USDC.
              </p>
              <div className="flex items-center gap-2 text-[var(--accent)] font-medium">
                <span>Create Data Collection Job</span>
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-150"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </div>
            </button>

            {/* Worker Card */}
            <button
              onClick={() => router.push("/worker")}
              className="group bg-[var(--surface)] border border-[var(--border)] rounded-lg p-8 text-left hover:border-[var(--accent)] hover:shadow-[0_0_30px_var(--accent-glow)] transition-all duration-150 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-lg bg-[var(--surface-2)] flex items-center justify-center mb-6 group-hover:bg-[var(--accent-muted)] transition-colors duration-150">
                <svg
                  className="w-7 h-7 text-[var(--accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z"
                  />
                </svg>
              </div>
              <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-xl font-bold text-[var(--text-primary)] mb-3">
                Earn with AI Agents
              </h2>
              <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                Install the extension, approve job types, and let your AI agents
                earn for you. Complete tasks anonymously — browse jobs manually
                or set it to auto-pilot.
              </p>
              <div className="flex items-center gap-2 text-[var(--accent)] font-medium">
                <span>Start Earning</span>
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-150"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </div>
            </button>
          </div>

          {/* Footer note */}
          <p className="text-center text-[var(--text-muted)] text-sm mt-8">
            You can switch between roles anytime from your dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
