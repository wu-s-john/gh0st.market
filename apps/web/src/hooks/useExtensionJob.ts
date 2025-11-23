"use client";

import { useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import {
  useJobExecution,
  useExtensionConnection,
  type JobExecutionState,
} from "@/hooks/useExtension";
import { type StartJobPayload, type JobStatus } from "@/lib/extensionMessages";

/**
 * Get user-friendly message for job status
 */
function getStatusMessage(status: JobStatus, progress: number): string {
  switch (status) {
    case "pending":
      return "Sending job to extension...";
    case "navigating":
      return "Agent navigating to target...";
    case "collecting":
      return `Agent collecting data (${progress}%)...`;
    case "generating_proof":
      return "Generating zk-TLS proof...";
    case "submitting":
      return "Submitting proof to blockchain...";
    case "completed":
      return "Job completed successfully!";
    case "failed":
      return "Job failed";
    default:
      return "Processing...";
  }
}

export interface UseExtensionJobReturn {
  /**
   * Start a job via the extension with toast notifications
   */
  startJob: (payload: StartJobPayload) => void;

  /**
   * Current job execution state
   */
  state: JobExecutionState;

  /**
   * Whether extension is connected
   */
  extensionConnected: boolean;

  /**
   * Whether a job is currently running
   */
  isRunning: boolean;
}

/**
 * Hook that combines job execution with toast notifications.
 * Shows progress toasts as the extension processes the job.
 */
export function useExtensionJob(): UseExtensionJobReturn {
  const { showToast, updateToast, dismissToast } = useToast();
  const { state, startJob: executeJob, reset } = useJobExecution();
  const { connected: extensionConnected } = useExtensionConnection();

  // Track toast ID for the current job
  const toastIdRef = useRef<string | null>(null);
  const lastStatusRef = useRef<JobStatus | null>(null);

  // Update toast when job state changes
  useEffect(() => {
    if (!state.jobId) {
      // No active job, dismiss any existing toast after a delay
      if (toastIdRef.current && lastStatusRef.current === "completed") {
        // Keep success toast visible briefly
        setTimeout(() => {
          if (toastIdRef.current) {
            dismissToast(toastIdRef.current);
            toastIdRef.current = null;
          }
        }, 3000);
      }
      return;
    }

    const { status, progress, error, result } = state;

    if (!status) return;

    // Create toast if we don't have one
    if (!toastIdRef.current) {
      toastIdRef.current = showToast(
        getStatusMessage(status, progress),
        status === "completed" ? "success" : status === "failed" ? "error" : "pending"
      );
      lastStatusRef.current = status;
      return;
    }

    // Update existing toast
    if (status !== lastStatusRef.current || status === "collecting") {
      lastStatusRef.current = status;

      if (status === "completed") {
        updateToast(
          toastIdRef.current,
          result?.txHash
            ? `Job completed! TX: ${result.txHash.slice(0, 10)}...`
            : "Job completed successfully!",
          "success"
        );
      } else if (status === "failed") {
        updateToast(
          toastIdRef.current,
          error || "Job failed",
          "error"
        );
      } else {
        updateToast(
          toastIdRef.current,
          getStatusMessage(status, progress),
          status === "submitting" ? "confirming" : "pending"
        );
      }
    }
  }, [state, showToast, updateToast, dismissToast]);

  // Clean up toast when component unmounts
  useEffect(() => {
    return () => {
      if (toastIdRef.current) {
        dismissToast(toastIdRef.current);
      }
    };
  }, [dismissToast]);

  const startJob = useCallback(
    (payload: StartJobPayload) => {
      // Check extension connection
      if (!extensionConnected) {
        showToast("Extension not connected. Please install the gh0st.market extension.", "error");
        return;
      }

      // Reset any previous job state
      reset();
      if (toastIdRef.current) {
        dismissToast(toastIdRef.current);
        toastIdRef.current = null;
      }
      lastStatusRef.current = null;

      // Start the job
      executeJob(payload);
    },
    [extensionConnected, executeJob, reset, showToast, dismissToast]
  );

  const isRunning =
    !!state.jobId &&
    state.status !== null &&
    state.status !== "completed" &&
    state.status !== "failed";

  return {
    startJob,
    state,
    extensionConnected,
    isRunning,
  };
}
