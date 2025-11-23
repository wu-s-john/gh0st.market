/**
 * Worker Engine - Combines all modules into a unified interface.
 */

import { startJobListener, resetListenerState } from "./jobListener";
import { createJobQueue, type JobQueue } from "./jobQueue";
import { createQueueProcessor, type QueueProcessor } from "./queueProcessor";
import { isClientsInitialized } from "./config";
import type { JobWithSpec, JobProgress, JobResult, WorkerStatus, JobStep } from "./types";

// Worker tab URL
const WORKER_TAB_URL = "http://localhost:3000/worker/runner";

export interface WorkerEngineConfig {
  /** Initial approved spec IDs */
  approvedSpecIds?: Set<number>;
  /** Initial min bounty by spec */
  minBountyBySpec?: Map<number, number>;
}

export interface WorkerEngine {
  // Lifecycle
  start(): void;
  stop(): void;

  // Worker tab
  openWorkerTab(): Promise<number>;
  closeWorkerTab(): void;
  getWorkerTabId(): number | null;

  // Queue
  getQueuedJobs(): JobWithSpec[];
  getCurrentJob(): JobWithSpec | null;

  // Approved specs
  setApprovedSpecs(specIds: Set<number>, minBountyBySpec: Map<number, number>): void;

  // Auto-mode
  setAutoMode(enabled: boolean): void;
  getAutoMode(): boolean;

  // Manual trigger
  processNextJob(): Promise<JobResult | null>;

  // Status
  getStatus(): WorkerStatus;

  // Events
  onStatusChange(cb: (status: WorkerStatus) => void): () => void;
  onProgress(cb: (progress: JobProgress) => void): () => void;
  onJobComplete(cb: (result: JobResult) => void): () => void;
}

/**
 * Create the worker engine.
 */
export function createWorkerEngine(config: WorkerEngineConfig = {}): WorkerEngine {
  // State
  let workerTabId: number | null = null;
  let approvedSpecIds = config.approvedSpecIds || new Set<number>();
  let minBountyBySpec = config.minBountyBySpec || new Map<number, number>();
  let stopListener: (() => void) | null = null;
  let currentStep: JobStep | null = null;
  let currentProgress = 0;

  // Listeners
  const statusListeners = new Set<(status: WorkerStatus) => void>();
  const progressListeners = new Set<(progress: JobProgress) => void>();
  const completeListeners = new Set<(result: JobResult) => void>();

  // Create queue
  const queue: JobQueue = createJobQueue();

  // Create processor
  const processor: QueueProcessor = createQueueProcessor({
    queue,
    getWorkerTabId: () => workerTabId,
    onProgress: (progress) => {
      currentStep = progress.step;
      currentProgress = progress.progress;
      progressListeners.forEach((cb) => cb(progress));
      notifyStatusChange();
    },
    onJobComplete: (result) => {
      currentStep = null;
      currentProgress = 0;
      completeListeners.forEach((cb) => cb(result));
      notifyStatusChange();
    },
    onStatusChange: () => {
      notifyStatusChange();
    },
  });

  function notifyStatusChange(): void {
    const status = getStatus();
    statusListeners.forEach((cb) => cb(status));
  }

  function getStatus(): WorkerStatus {
    return {
      workerTabOpen: workerTabId !== null,
      workerTabId,
      autoMode: processor.isAutoMode(),
      queueLength: queue.length(),
      currentJob: processor.getCurrentJob(),
      currentStep,
      currentProgress,
    };
  }

  function startListening(): void {
    if (stopListener) return;

    // Don't start if clients not initialized
    if (!isClientsInitialized()) {
      console.log("[workerEngine] Clients not initialized, skipping listener start");
      return;
    }

    stopListener = startJobListener({
      approvedSpecIds,
      minBountyBySpec,
      onJobFound: (job) => {
        queue.enqueue(job);
        notifyStatusChange();

        // If auto-mode is on and we have a worker tab, start processing
        if (processor.isAutoMode() && workerTabId !== null) {
          processor.start();
        }
      },
    });
  }

  function stopListening(): void {
    if (stopListener) {
      stopListener();
      stopListener = null;
    }
  }

  // Listen for tab close
  chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === workerTabId) {
      console.log("[workerEngine] Worker tab closed");
      workerTabId = null;
      processor.pause();
      notifyStatusChange();
    }
  });

  // Subscribe to queue changes
  queue.onChange(() => {
    notifyStatusChange();
  });

  return {
    start(): void {
      console.log("[workerEngine] Starting");
      startListening();
    },

    stop(): void {
      console.log("[workerEngine] Stopping");
      stopListening();
      processor.pause();
      queue.clear();
      resetListenerState();
    },

    async openWorkerTab(): Promise<number> {
      // If tab exists, focus it
      if (workerTabId !== null) {
        try {
          await chrome.tabs.update(workerTabId, { active: true });
          return workerTabId;
        } catch {
          // Tab might have been closed
          workerTabId = null;
        }
      }

      // Create new tab
      const tab = await chrome.tabs.create({ url: WORKER_TAB_URL });
      workerTabId = tab.id!;
      console.log(`[workerEngine] Opened worker tab ${workerTabId}`);
      notifyStatusChange();

      return workerTabId;
    },

    closeWorkerTab(): void {
      if (workerTabId !== null) {
        chrome.tabs.remove(workerTabId).catch(() => {});
        workerTabId = null;
        processor.pause();
        notifyStatusChange();
      }
    },

    getWorkerTabId(): number | null {
      return workerTabId;
    },

    getQueuedJobs(): JobWithSpec[] {
      return queue.getAll();
    },

    getCurrentJob(): JobWithSpec | null {
      return processor.getCurrentJob();
    },

    setApprovedSpecs(specIds: Set<number>, bountyBySpec: Map<number, number>): void {
      approvedSpecIds = specIds;
      minBountyBySpec = bountyBySpec;

      // Restart listener with new config
      if (stopListener) {
        stopListening();
        startListening();
      }
    },

    setAutoMode(enabled: boolean): void {
      if (enabled) {
        if (workerTabId === null) {
          console.log("[workerEngine] Cannot enable auto-mode without worker tab");
          return;
        }
        processor.start();
      } else {
        processor.pause();
      }
      notifyStatusChange();
    },

    getAutoMode(): boolean {
      return processor.isAutoMode();
    },

    async processNextJob(): Promise<JobResult | null> {
      if (workerTabId === null) {
        console.log("[workerEngine] Cannot process without worker tab");
        return null;
      }
      return processor.processOne();
    },

    getStatus,

    onStatusChange(cb: (status: WorkerStatus) => void): () => void {
      statusListeners.add(cb);
      cb(getStatus());
      return () => statusListeners.delete(cb);
    },

    onProgress(cb: (progress: JobProgress) => void): () => void {
      progressListeners.add(cb);
      return () => progressListeners.delete(cb);
    },

    onJobComplete(cb: (result: JobResult) => void): () => void {
      completeListeners.add(cb);
      return () => completeListeners.delete(cb);
    },
  };
}

// Singleton instance
let engineInstance: WorkerEngine | null = null;

export function getWorkerEngine(): WorkerEngine {
  if (!engineInstance) {
    engineInstance = createWorkerEngine();
  }
  return engineInstance;
}
