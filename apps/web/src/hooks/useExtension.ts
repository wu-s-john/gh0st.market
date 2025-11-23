"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  sendToExtension,
  sendToExtensionWithResponse,
  checkExtensionInstalled,
  subscribeToExtension,
  type ExtensionToWebMessage,
  type StartJobPayload,
  type JobStatus,
  type JobProgressPayload,
} from "@/lib/extensionMessages";

// ============================================
// Extension Connection Hook
// ============================================

export interface ExtensionState {
  connected: boolean;
  version?: string;
  checking: boolean;
}

/**
 * Hook to check and monitor extension connection status.
 */
export function useExtensionConnection(): ExtensionState {
  const [state, setState] = useState<ExtensionState>({
    connected: false,
    checking: true,
  });

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const result = await checkExtensionInstalled();
      if (mounted) {
        setState({
          connected: result.installed,
          version: result.version,
          checking: false,
        });
      }
    };

    check();

    // Re-check when extension announces it's ready
    const unsubscribe = subscribeToExtension((message) => {
      if (message.type === "GH0ST_EXTENSION_READY" || message.type === "GH0ST_PONG") {
        check();
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return state;
}

// ============================================
// Job Execution Hook
// ============================================

export interface JobExecutionState {
  jobId: string | null;
  status: JobStatus | null;
  progress: number;
  message?: string;
  error?: string;
  result?: {
    resultPayload: string;
    proofData: string;
    txHash?: string;
  };
}

export interface UseJobExecutionReturn {
  state: JobExecutionState;
  startJob: (payload: StartJobPayload) => void;
  reset: () => void;
}

/**
 * Hook to manage job execution via the extension.
 */
export function useJobExecution(): UseJobExecutionReturn {
  const [state, setState] = useState<JobExecutionState>({
    jobId: null,
    status: null,
    progress: 0,
  });

  useEffect(() => {
    const unsubscribe = subscribeToExtension((message) => {
      switch (message.type) {
        case "GH0ST_JOB_STARTED":
          setState((prev) => ({
            ...prev,
            jobId: message.payload.jobId,
            status: "pending",
            progress: 0,
            error: undefined,
            result: undefined,
          }));
          break;

        case "GH0ST_JOB_PROGRESS":
          setState((prev) => {
            if (prev.jobId !== message.payload.jobId) return prev;
            return {
              ...prev,
              status: message.payload.status,
              progress: message.payload.progress,
              message: message.payload.message,
            };
          });
          break;

        case "GH0ST_JOB_COMPLETED":
          setState((prev) => {
            if (prev.jobId !== message.payload.jobId) return prev;
            return {
              ...prev,
              status: "completed",
              progress: 100,
              result: {
                resultPayload: message.payload.resultPayload,
                proofData: message.payload.proofData,
                txHash: message.payload.txHash,
              },
            };
          });
          break;

        case "GH0ST_JOB_FAILED":
          setState((prev) => {
            if (prev.jobId !== message.payload.jobId) return prev;
            return {
              ...prev,
              status: "failed",
              error: message.payload.error,
            };
          });
          break;
      }
    });

    return unsubscribe;
  }, []);

  const startJob = useCallback((payload: StartJobPayload) => {
    setState({
      jobId: payload.jobId,
      status: "pending",
      progress: 0,
      message: "Sending to extension...",
    });
    sendToExtension({ type: "GH0ST_START_JOB", payload });
  }, []);

  const reset = useCallback(() => {
    setState({
      jobId: null,
      status: null,
      progress: 0,
    });
  }, []);

  return { state, startJob, reset };
}

// ============================================
// Extension Query Hook
// ============================================

export interface FollowedSpec {
  id: number;
  specId: number;
  walletAddress: string;
  mainDomain: string;
  minBounty: number;
  autoClaim: boolean;
  createdAt: Date;
}

export interface ActiveJob {
  id: number;
  jobId: string;
  specId: number;
  mainDomain: string;
  status: JobStatus;
  progress: number;
  bounty: string;
  token: string;
  startedAt: Date;
}

/**
 * Query followed specs from extension.
 */
export function useFollowedSpecs(walletAddress: string | undefined) {
  const [specs, setSpecs] = useState<FollowedSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setSpecs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await sendToExtensionWithResponse<
        Extract<ExtensionToWebMessage, { type: "GH0ST_QUERY_RESULT" }>
      >(
        { type: "GH0ST_QUERY", payload: { query: "GET_FOLLOWED_SPECS", walletAddress } },
        "GH0ST_QUERY_RESULT",
        5000
      );

      if (response.payload.error) {
        setError(response.payload.error);
      } else {
        setSpecs(response.payload.data as FollowedSpec[]);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to query extension");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { specs, loading, error, refresh };
}

/**
 * Query active jobs from extension.
 */
export function useActiveJobs() {
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await sendToExtensionWithResponse<
        Extract<ExtensionToWebMessage, { type: "GH0ST_QUERY_RESULT" }>
      >(
        { type: "GH0ST_QUERY", payload: { query: "GET_ACTIVE_JOBS" } },
        "GH0ST_QUERY_RESULT",
        5000
      );

      if (response.payload.error) {
        setError(response.payload.error);
      } else {
        setJobs(response.payload.data as ActiveJob[]);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to query extension");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Refresh when jobs change
    const unsubscribe = subscribeToExtension((message) => {
      if (
        message.type === "GH0ST_JOB_STARTED" ||
        message.type === "GH0ST_JOB_COMPLETED" ||
        message.type === "GH0ST_JOB_FAILED"
      ) {
        refresh();
      }
    });

    return unsubscribe;
  }, [refresh]);

  return { jobs, loading, error, refresh };
}

// ============================================
// Follow/Unfollow Spec Actions
// ============================================

export function useFollowSpec() {
  const [loading, setLoading] = useState(false);

  const followSpec = useCallback(
    async (params: {
      specId: number;
      walletAddress: string;
      mainDomain: string;
      minBounty?: number;
      autoClaim?: boolean;
    }) => {
      setLoading(true);
      try {
        sendToExtension({
          type: "GH0ST_FOLLOW_SPEC",
          payload: params,
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const unfollowSpec = useCallback(
    async (specId: number, walletAddress: string) => {
      setLoading(true);
      try {
        sendToExtension({
          type: "GH0ST_UNFOLLOW_SPEC",
          payload: { specId, walletAddress },
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { followSpec, unfollowSpec, loading };
}
