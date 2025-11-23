/**
 * Shared types for the worker engine modules.
 */

import type { VlayerProveOutput } from "../schemas/vlayer";

// ============================================
// Job Types
// ============================================

export interface JobWithSpec {
  /** On-chain job ID */
  jobId: bigint;
  /** Spec ID this job belongs to */
  specId: bigint;
  /** Job inputs (JSON string) */
  inputs: string;
  /** Bounty amount in wei */
  bounty: bigint;
  /** Token address (0x0 for ETH) */
  token: `0x${string}`;
  /** Requester address */
  requester: `0x${string}`;
  /** Requester contact info */
  requesterContact: string;
  // Denormalized from spec
  /** Main domain for the spec */
  mainDomain: string;
  /** URL to notarize */
  notarizeUrl: string;
  /** Prompt instructions for AI */
  promptInstructions: string;
  /** Expected output schema */
  outputSchema: string;
}

// ============================================
// Execution Types
// ============================================

export type JobStep =
  | "queued"
  | "navigating"
  | "page_loaded"
  | "fetching"
  | "generating_proof"
  | "submitting_tx"
  | "tx_confirmed"
  | "complete"
  | "failed";

export interface JobProgress {
  jobId: bigint;
  step: JobStep;
  progress: number; // 0-100
  message: string;
}

export interface JobResult {
  jobId: bigint;
  success: boolean;
  proof?: VlayerProveOutput;
  resultPayload?: string;
  txHash?: string;
  error?: string;
}

// ============================================
// Queue Types
// ============================================

export type QueueStatus = "idle" | "processing" | "paused";

// ============================================
// Worker Status (for popup)
// ============================================

export interface WorkerStatus {
  /** Is worker tab open */
  workerTabOpen: boolean;
  /** Worker tab ID if open */
  workerTabId: number | null;
  /** Auto-mode enabled */
  autoMode: boolean;
  /** Number of jobs in queue */
  queueLength: number;
  /** Currently executing job */
  currentJob: JobWithSpec | null;
  /** Current execution step */
  currentStep: JobStep | null;
  /** Current progress percentage */
  currentProgress: number;
}
