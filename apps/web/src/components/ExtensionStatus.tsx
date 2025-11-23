"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  useExtensionConnection,
  useActiveJobs,
  type ActiveJob,
} from "@/hooks/useExtension";
import { subscribeToExtension, type JobStatus } from "@/lib/extensionMessages";

export interface ExtensionState {
  connected: boolean;
  version?: string;
  checking?: boolean;
  activeTask?: {
    jobId: string;
    specDomain: string;
    status: JobStatus;
    progress: number;
  };
}

/**
 * Hook to check extension connection status and track active tasks.
 */
export function useExtensionStatus(): ExtensionState {
  const connection = useExtensionConnection();
  const [activeTask, setActiveTask] = useState<ExtensionState["activeTask"]>();

  // Also support mock mode for development
  const [mockMode, setMockMode] = useState(false);

  useEffect(() => {
    // Check for mock mode
    if (typeof window !== "undefined") {
      setMockMode(localStorage.getItem("gh0st_extension_mock") === "true");
    }
  }, []);

  useEffect(() => {
    // If connected, listen for job progress updates
    if (!connection.connected) {
      setActiveTask(undefined);
      return;
    }

    const unsubscribe = subscribeToExtension((message) => {
      switch (message.type) {
        case "GH0ST_JOB_STARTED":
          // We'll get domain from progress update
          setActiveTask({
            jobId: message.payload.jobId,
            specDomain: "...",
            status: "pending",
            progress: 0,
          });
          break;

        case "GH0ST_JOB_PROGRESS":
          setActiveTask((prev) => {
            if (prev?.jobId !== message.payload.jobId) {
              return {
                jobId: message.payload.jobId,
                specDomain: prev?.specDomain || "...",
                status: message.payload.status,
                progress: message.payload.progress,
              };
            }
            return {
              ...prev,
              status: message.payload.status,
              progress: message.payload.progress,
            };
          });
          break;

        case "GH0ST_JOB_COMPLETED":
        case "GH0ST_JOB_FAILED":
          setActiveTask((prev) => {
            if (prev?.jobId === message.payload.jobId) {
              return undefined;
            }
            return prev;
          });
          break;
      }
    });

    return unsubscribe;
  }, [connection.connected]);

  // Mock mode fallback for development
  if (mockMode && !connection.connected) {
    return {
      connected: true,
      version: "dev",
      activeTask: {
        jobId: "0x7f3a8b2c9d4e5f6a",
        specDomain: "crunchbase.com",
        status: "collecting",
        progress: 45,
      },
    };
  }

  return {
    connected: connection.connected,
    version: connection.version,
    checking: connection.checking,
    activeTask,
  };
}

interface ExtensionStatusProps {
  variant?: "sidebar" | "card" | "inline";
  showActiveTask?: boolean;
}

function getStatusLabel(status: JobStatus): string {
  switch (status) {
    case "pending":
      return "Starting...";
    case "navigating":
      return "Navigating";
    case "collecting":
      return "Collecting Data";
    case "generating_proof":
      return "Generating Proof";
    case "submitting":
      return "Submitting";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return "Running";
  }
}

export function ExtensionStatus({
  variant = "sidebar",
  showActiveTask = true,
}: ExtensionStatusProps) {
  const { connected, version, checking, activeTask } = useExtensionStatus();

  if (variant === "inline") {
    return (
      <div className="inline-flex items-center gap-2 text-sm">
        {checking ? (
          <>
            <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-pulse" />
            <span className="text-[var(--text-secondary)]">Checking...</span>
          </>
        ) : (
          <>
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-[var(--success)]" : "bg-[var(--error)]"
              }`}
            />
            <span className="text-[var(--text-secondary)]">
              {connected ? "Extension Connected" : "Extension Not Connected"}
            </span>
          </>
        )}
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
                checking
                  ? "bg-[var(--text-muted)] animate-pulse"
                  : connected
                    ? "bg-[var(--success)]"
                    : "bg-[var(--text-muted)]"
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
          {checking ? "Checking..." : connected ? "Connected" : "Not Connected"}
        </p>

        {connected && activeTask && showActiveTask && (
          <div className="text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-[var(--accent)]">
                {getStatusLabel(activeTask.status)}
              </span>
              <span className="text-[var(--text-muted)]">
                {activeTask.progress}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-1 h-1 bg-[var(--surface)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${activeTask.progress}%` }}
              />
            </div>
          </div>
        )}

        {!connected && !checking && (
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
            checking
              ? "bg-[var(--text-muted)] animate-pulse"
              : connected
                ? "bg-[var(--success)]"
                : "bg-[var(--error)]"
          }`}
        />
        <span className="text-sm text-[var(--text-primary)]">
          {checking ? "Checking..." : connected ? "Connected" : "Not Connected"}
        </span>
      </div>

      {connected && activeTask && showActiveTask && (
        <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-md">
          <p className="text-xs text-[var(--text-muted)] mb-2">Current Task:</p>
          <div className="flex items-center justify-between mb-2">
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
                {getStatusLabel(activeTask.status)}
              </span>
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${activeTask.progress}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1 text-right">
            {activeTask.progress}%
          </p>
        </div>
      )}

      {!connected && !checking && (
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
