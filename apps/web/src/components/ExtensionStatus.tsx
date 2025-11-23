"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export interface ExtensionState {
  connected: boolean;
  version?: string;
  activeTask?: {
    jobId: string;
    specDomain: string;
    status: "running" | "pending_proof" | "submitting";
  };
}

// Hook to check extension connection status
// In production, this would communicate with the actual extension
export function useExtensionStatus(): ExtensionState {
  const [state, setState] = useState<ExtensionState>({ connected: false });

  useEffect(() => {
    // Mock: Check for extension connection
    // In production: window.postMessage or chrome.runtime.sendMessage
    const checkExtension = () => {
      // For now, simulate based on localStorage flag (for testing)
      const mockConnected = localStorage.getItem("gh0st_extension_mock") === "true";
      setState({
        connected: mockConnected,
        version: mockConnected ? "1.0.2" : undefined,
        activeTask: mockConnected
          ? {
              jobId: "0x7f3a8b2c9d4e5f6a",
              specDomain: "crunchbase.com",
              status: "running",
            }
          : undefined,
      });
    };

    checkExtension();

    // Listen for extension status updates
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "GH0ST_EXTENSION_STATUS") {
        setState(event.data.payload);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return state;
}

interface ExtensionStatusProps {
  variant?: "sidebar" | "card" | "inline";
  showActiveTask?: boolean;
}

export function ExtensionStatus({
  variant = "sidebar",
  showActiveTask = true
}: ExtensionStatusProps) {
  const { connected, version, activeTask } = useExtensionStatus();

  if (variant === "inline") {
    return (
      <div className="inline-flex items-center gap-2 text-sm">
        <span
          className={`w-2 h-2 rounded-full ${
            connected ? "bg-[var(--success)]" : "bg-[var(--error)]"
          }`}
        />
        <span className="text-[var(--text-secondary)]">
          {connected ? "Extension Connected" : "Extension Not Connected"}
        </span>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className="mx-3 mb-4 p-3 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-[var(--success)]" : "bg-[var(--text-muted)]"
              }`}
            />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Extension
            </span>
          </div>
          {version && (
            <span className="text-xs text-[var(--text-muted)]">v{version}</span>
          )}
        </div>

        <p className="text-xs text-[var(--text-muted)] mb-2">
          {connected ? "Connected" : "Not Connected"}
        </p>

        {connected && activeTask && showActiveTask && (
          <div className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border)]">
            <span className="text-[var(--accent)]">1 task running</span>
          </div>
        )}

        {!connected && (
          <Link
            href="/worker/extension"
            className="block text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            Get Extension
          </Link>
        )}
      </div>
    );
  }

  // Card variant - larger, for dashboard
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-[family-name:var(--font-jetbrains-mono)] text-base font-semibold text-[var(--text-primary)]">
          Extension Status
        </h3>
        {version && (
          <span className="text-xs text-[var(--text-muted)] font-[family-name:var(--font-jetbrains-mono)]">
            v{version}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            connected ? "bg-[var(--success)]" : "bg-[var(--error)]"
          }`}
        />
        <span className="text-sm text-[var(--text-primary)]">
          {connected ? "Connected" : "Not Connected"}
        </span>
      </div>

      {connected && activeTask && showActiveTask && (
        <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-md">
          <p className="text-xs text-[var(--text-muted)] mb-2">Current Task:</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[var(--text-primary)]">
                {activeTask.jobId.slice(0, 6)}...{activeTask.jobId.slice(-4)}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {activeTask.specDomain}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="text-[var(--accent)]">
                {activeTask.status === "running" && "Running"}
                {activeTask.status === "pending_proof" && "Generating Proof"}
                {activeTask.status === "submitting" && "Submitting"}
              </span>
            </span>
          </div>
        </div>
      )}

      {!connected && (
        <Link
          href="/worker/extension"
          className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-md hover:bg-[var(--accent-hover)] transition-colors"
        >
          Get Extension
        </Link>
      )}
    </div>
  );
}
