/**
 * Queue Processor - Orchestrates job execution with auto-mode support.
 */

import type { JobQueue } from "./jobQueue";
import { executeJob } from "./jobExecutor";
import type { JobWithSpec, JobProgress, JobResult, QueueStatus } from "./types";

export interface QueueProcessorConfig {
  /** Job queue instance */
  queue: JobQueue;
  /** Get current worker tab ID (null if closed) */
  getWorkerTabId: () => number | null;
  /** Progress callback */
  onProgress: (progress: JobProgress) => void;
  /** Job completion callback */
  onJobComplete: (result: JobResult) => void;
  /** Status change callback */
  onStatusChange: (status: QueueStatus) => void;
}

export interface QueueProcessor {
  /** Start processing queue (auto-mode ON) */
  start(): void;

  /** Pause processing (auto-mode OFF) */
  pause(): void;

  /** Process single job then pause */
  processOne(): Promise<JobResult | null>;

  /** Current status */
  getStatus(): QueueStatus;

  /** Currently executing job */
  getCurrentJob(): JobWithSpec | null;

  /** Is auto-mode enabled */
  isAutoMode(): boolean;
}

/**
 * Create a queue processor.
 */
export function createQueueProcessor(config: QueueProcessorConfig): QueueProcessor {
  let status: QueueStatus = "idle";
  let autoMode = false;
  let currentJob: JobWithSpec | null = null;
  let isProcessing = false;

  function setStatus(newStatus: QueueStatus): void {
    status = newStatus;
    config.onStatusChange(newStatus);
  }

  async function processNextJob(): Promise<JobResult | null> {
    const workerTabId = config.getWorkerTabId();

    // Can't process without worker tab
    if (workerTabId === null) {
      console.log("[queueProcessor] No worker tab, stopping");
      setStatus("idle");
      return null;
    }

    // Get next job
    const job = config.queue.dequeue();
    if (!job) {
      console.log("[queueProcessor] Queue empty");
      setStatus("idle");
      return null;
    }

    currentJob = job;
    setStatus("processing");
    isProcessing = true;

    try {
      const result = await executeJob(job, {
        workerTabId,
        onProgress: config.onProgress,
      });

      config.onJobComplete(result);
      return result;
    } finally {
      currentJob = null;
      isProcessing = false;
    }
  }

  async function processLoop(): Promise<void> {
    while (autoMode && config.queue.length() > 0) {
      const workerTabId = config.getWorkerTabId();

      // Stop if worker tab closed
      if (workerTabId === null) {
        console.log("[queueProcessor] Worker tab closed, stopping auto-mode");
        autoMode = false;
        setStatus("idle");
        return;
      }

      await processNextJob();

      // Small delay between jobs
      if (autoMode && config.queue.length() > 0) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    if (!autoMode) {
      setStatus("paused");
    } else {
      setStatus("idle");
    }
  }

  return {
    start(): void {
      if (autoMode) return;

      console.log("[queueProcessor] Starting auto-mode");
      autoMode = true;

      if (!isProcessing) {
        processLoop();
      }
    },

    pause(): void {
      if (!autoMode) return;

      console.log("[queueProcessor] Pausing auto-mode");
      autoMode = false;
      setStatus("paused");
    },

    async processOne(): Promise<JobResult | null> {
      if (isProcessing) {
        console.log("[queueProcessor] Already processing a job");
        return null;
      }

      return processNextJob();
    },

    getStatus(): QueueStatus {
      return status;
    },

    getCurrentJob(): JobWithSpec | null {
      return currentJob;
    },

    isAutoMode(): boolean {
      return autoMode;
    },
  };
}
