/**
 * Job Queue - In-memory queue for pending jobs.
 */

import type { JobWithSpec } from "./types";

export interface JobQueue {
  /** Add job to end of queue */
  enqueue(job: JobWithSpec): void;

  /** Get next job without removing */
  peek(): JobWithSpec | null;

  /** Remove and return next job */
  dequeue(): JobWithSpec | null;

  /** Current queue length */
  length(): number;

  /** All queued jobs (for UI) */
  getAll(): JobWithSpec[];

  /** Remove specific job by ID */
  remove(jobId: bigint): boolean;

  /** Check if job is already in queue */
  has(jobId: bigint): boolean;

  /** Clear all jobs */
  clear(): void;

  /** Subscribe to queue changes */
  onChange(callback: (jobs: JobWithSpec[]) => void): () => void;
}

/**
 * Create a new in-memory job queue.
 */
export function createJobQueue(): JobQueue {
  const jobs: JobWithSpec[] = [];
  const listeners: Set<(jobs: JobWithSpec[]) => void> = new Set();

  function notifyListeners(): void {
    const snapshot = [...jobs];
    listeners.forEach((cb) => cb(snapshot));
  }

  return {
    enqueue(job: JobWithSpec): void {
      // Don't add duplicates
      if (jobs.some((j) => j.jobId === job.jobId)) {
        console.log(`[jobQueue] Job ${job.jobId} already in queue, skipping`);
        return;
      }
      jobs.push(job);
      console.log(`[jobQueue] Enqueued job ${job.jobId}, queue length: ${jobs.length}`);
      notifyListeners();
    },

    peek(): JobWithSpec | null {
      return jobs[0] || null;
    },

    dequeue(): JobWithSpec | null {
      const job = jobs.shift() || null;
      if (job) {
        console.log(`[jobQueue] Dequeued job ${job.jobId}, queue length: ${jobs.length}`);
        notifyListeners();
      }
      return job;
    },

    length(): number {
      return jobs.length;
    },

    getAll(): JobWithSpec[] {
      return [...jobs];
    },

    remove(jobId: bigint): boolean {
      const index = jobs.findIndex((j) => j.jobId === jobId);
      if (index !== -1) {
        jobs.splice(index, 1);
        console.log(`[jobQueue] Removed job ${jobId}, queue length: ${jobs.length}`);
        notifyListeners();
        return true;
      }
      return false;
    },

    has(jobId: bigint): boolean {
      return jobs.some((j) => j.jobId === jobId);
    },

    clear(): void {
      jobs.length = 0;
      console.log("[jobQueue] Cleared");
      notifyListeners();
    },

    onChange(callback: (jobs: JobWithSpec[]) => void): () => void {
      listeners.add(callback);
      // Immediately call with current state
      callback([...jobs]);
      return () => {
        listeners.delete(callback);
      };
    },
  };
}
