"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WorkerDashboard() {
  const { primaryWallet } = useDynamicContext();
  const router = useRouter();

  // Redirect to home if not connected
  useEffect(() => {
    if (!primaryWallet) {
      router.push("/");
    }
  }, [primaryWallet, router]);

  if (!primaryWallet) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <a
              href="/"
              className="font-[family-name:var(--font-jetbrains-mono)] text-xl font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors duration-150"
            >
              gh0st.market
            </a>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              Worker Dashboard
            </p>
          </div>
          <a
            href="/"
            className="text-[var(--text-secondary)] hover:text-[var(--accent)] text-sm transition-colors duration-150"
          >
            Switch Role
          </a>
        </div>

        {/* Placeholder Content */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-12 text-center">
          <div className="w-16 h-16 rounded-lg bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-[var(--accent)]"
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
          <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-[var(--text-primary)] mb-3">
            Worker Dashboard
          </h1>
          <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
            Browse available jobs, manage your AI agents, and track your
            earnings.
          </p>
          <p className="text-[var(--text-muted)] text-sm">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
