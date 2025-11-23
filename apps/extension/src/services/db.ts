import { eq, and } from "drizzle-orm";
import { getDb, persistDb } from "../db/client";
import {
  followedSpecs,
  activeJobs,
  jobHistory,
  type FollowedSpec,
  type ActiveJob,
  type JobHistoryRecord,
  type JobStatus,
} from "../db/schema";

// ============================================
// Followed Specs Operations
// ============================================

export interface AddFollowedSpecParams {
  specId: number;
  walletAddress: string;
  mainDomain: string;
  minBounty?: number;
  autoClaim?: boolean;
}

export async function addFollowedSpec(params: AddFollowedSpecParams): Promise<FollowedSpec> {
  const db = await getDb();

  const result = await db
    .insert(followedSpecs)
    .values({
      specId: params.specId,
      walletAddress: params.walletAddress,
      mainDomain: params.mainDomain,
      minBounty: params.minBounty ?? 0,
      autoClaim: params.autoClaim ?? false,
    })
    .returning();

  await persistDb();
  return result[0];
}

export async function getFollowedSpecs(walletAddress: string): Promise<FollowedSpec[]> {
  const db = await getDb();
  return db.select().from(followedSpecs).where(eq(followedSpecs.walletAddress, walletAddress));
}

export async function getFollowedSpecBySpecId(
  walletAddress: string,
  specId: number
): Promise<FollowedSpec | undefined> {
  const db = await getDb();
  const results = await db
    .select()
    .from(followedSpecs)
    .where(and(eq(followedSpecs.walletAddress, walletAddress), eq(followedSpecs.specId, specId)));
  return results[0];
}

export async function removeFollowedSpec(walletAddress: string, specId: number): Promise<void> {
  const db = await getDb();
  await db
    .delete(followedSpecs)
    .where(and(eq(followedSpecs.walletAddress, walletAddress), eq(followedSpecs.specId, specId)));
  await persistDb();
}

export async function updateFollowedSpec(
  walletAddress: string,
  specId: number,
  updates: { minBounty?: number; autoClaim?: boolean }
): Promise<void> {
  const db = await getDb();
  await db
    .update(followedSpecs)
    .set(updates)
    .where(and(eq(followedSpecs.walletAddress, walletAddress), eq(followedSpecs.specId, specId)));
  await persistDb();
}

// ============================================
// Active Jobs Operations
// ============================================

export interface CreateActiveJobParams {
  jobId: string;
  specId: number;
  mainDomain: string;
  notarizeUrl: string;
  inputs?: Record<string, unknown>;
  promptInstructions?: string;
  outputSchema?: string;
  bounty: string;
  token: string;
}

export async function createActiveJob(params: CreateActiveJobParams): Promise<ActiveJob> {
  const db = await getDb();

  const result = await db
    .insert(activeJobs)
    .values({
      jobId: params.jobId,
      specId: params.specId,
      mainDomain: params.mainDomain,
      notarizeUrl: params.notarizeUrl,
      inputs: params.inputs ? JSON.stringify(params.inputs) : null,
      promptInstructions: params.promptInstructions,
      outputSchema: params.outputSchema,
      bounty: params.bounty,
      token: params.token,
      status: "pending",
      progress: 0,
    })
    .returning();

  await persistDb();
  return result[0];
}

export async function getActiveJob(jobId: string): Promise<ActiveJob | undefined> {
  const db = await getDb();
  const results = await db.select().from(activeJobs).where(eq(activeJobs.jobId, jobId));
  return results[0];
}

export async function getAllActiveJobs(): Promise<ActiveJob[]> {
  const db = await getDb();
  return db.select().from(activeJobs);
}

export async function getActiveJobsByStatus(status: JobStatus): Promise<ActiveJob[]> {
  const db = await getDb();
  return db.select().from(activeJobs).where(eq(activeJobs.status, status));
}

export async function getRunningJobs(): Promise<ActiveJob[]> {
  const db = await getDb();
  // Jobs that are not completed or failed
  return db
    .select()
    .from(activeJobs)
    .where(
      and(
        // Not completed
        eq(activeJobs.status, "pending")
      )
    );
}

export interface UpdateJobStatusParams {
  status: JobStatus;
  progress?: number;
  resultPayload?: string;
  proofData?: string;
  errorMessage?: string;
}

export async function updateJobStatus(jobId: string, params: UpdateJobStatusParams): Promise<void> {
  const db = await getDb();

  const updates: Partial<ActiveJob> = {
    status: params.status,
    progress: params.progress,
  };

  if (params.resultPayload !== undefined) {
    updates.resultPayload = params.resultPayload;
  }
  if (params.proofData !== undefined) {
    updates.proofData = params.proofData;
  }
  if (params.errorMessage !== undefined) {
    updates.errorMessage = params.errorMessage;
  }

  // Set completedAt for terminal states
  if (params.status === "completed" || params.status === "failed") {
    updates.completedAt = new Date();
  }

  await db.update(activeJobs).set(updates).where(eq(activeJobs.jobId, jobId));
  await persistDb();
}

export async function deleteActiveJob(jobId: string): Promise<void> {
  const db = await getDb();
  await db.delete(activeJobs).where(eq(activeJobs.jobId, jobId));
  await persistDb();
}

// ============================================
// Job History Operations
// ============================================

export interface AddJobHistoryParams {
  jobId: string;
  specId: number;
  mainDomain: string;
  bountyEarned?: string;
  token?: string;
  txHash?: string;
}

export async function addJobHistory(params: AddJobHistoryParams): Promise<JobHistoryRecord> {
  const db = await getDb();

  const result = await db
    .insert(jobHistory)
    .values({
      jobId: params.jobId,
      specId: params.specId,
      mainDomain: params.mainDomain,
      bountyEarned: params.bountyEarned,
      token: params.token,
      txHash: params.txHash,
    })
    .returning();

  await persistDb();
  return result[0];
}

export async function getJobHistory(limit = 50): Promise<JobHistoryRecord[]> {
  const db = await getDb();
  return db.select().from(jobHistory).orderBy(jobHistory.completedAt).limit(limit);
}

// ============================================
// Composite Operations
// ============================================

/**
 * Move a completed job from active_jobs to job_history.
 */
export async function completeAndArchiveJob(
  jobId: string,
  result: {
    resultPayload: string;
    proofData: string;
    txHash?: string;
  }
): Promise<void> {
  const job = await getActiveJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  // Update job as completed
  await updateJobStatus(jobId, {
    status: "completed",
    progress: 100,
    resultPayload: result.resultPayload,
    proofData: result.proofData,
  });

  // Add to history
  await addJobHistory({
    jobId: job.jobId,
    specId: job.specId,
    mainDomain: job.mainDomain,
    bountyEarned: job.bounty,
    token: job.token,
    txHash: result.txHash,
  });

  // Remove from active jobs
  await deleteActiveJob(jobId);
}

/**
 * Mark a job as failed and optionally archive it.
 */
export async function failJob(jobId: string, errorMessage: string): Promise<void> {
  await updateJobStatus(jobId, {
    status: "failed",
    errorMessage,
  });
}
