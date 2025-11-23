import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

/**
 * Job specs that the worker is following/monitoring.
 * When a new job matching these specs appears, it can be auto-claimed or shown in the UI.
 */
export const followedSpecs = sqliteTable("followed_specs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chainId: integer("chain_id").notNull().default(11155111), // Sepolia default
  specId: integer("spec_id").notNull(),
  walletAddress: text("wallet_address").notNull(),
  mainDomain: text("main_domain").notNull(),
  minBounty: real("min_bounty").default(0),
  autoClaim: integer("auto_claim", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

/**
 * Jobs currently being processed by the extension.
 */
export const activeJobs = sqliteTable("active_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chainId: integer("chain_id").notNull().default(11155111), // Sepolia default
  jobId: text("job_id").notNull(), // Unique per chain, not globally
  specId: integer("spec_id").notNull(),
  mainDomain: text("main_domain").notNull(),
  notarizeUrl: text("notarize_url").notNull(),
  inputs: text("inputs"), // JSON string of concrete inputs
  promptInstructions: text("prompt_instructions"),
  outputSchema: text("output_schema"),
  bounty: text("bounty").notNull(),
  token: text("token").notNull(),
  status: text("status", {
    enum: ["pending", "navigating", "collecting", "generating_proof", "submitting", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  progress: integer("progress").default(0), // 0-100
  resultPayload: text("result_payload"),
  proofData: text("proof_data"),
  errorMessage: text("error_message"),
  startedAt: integer("started_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

/**
 * Historical record of completed jobs for earnings tracking.
 */
export const jobHistory = sqliteTable("job_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chainId: integer("chain_id").notNull().default(11155111), // Sepolia default
  jobId: text("job_id").notNull(),
  specId: integer("spec_id").notNull(),
  mainDomain: text("main_domain").notNull(),
  bountyEarned: text("bounty_earned"),
  token: text("token"),
  txHash: text("tx_hash"),
  completedAt: integer("completed_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Type exports for use in services
export type FollowedSpec = typeof followedSpecs.$inferSelect;
export type NewFollowedSpec = typeof followedSpecs.$inferInsert;
export type ActiveJob = typeof activeJobs.$inferSelect;
export type NewActiveJob = typeof activeJobs.$inferInsert;
export type JobHistoryRecord = typeof jobHistory.$inferSelect;
export type NewJobHistoryRecord = typeof jobHistory.$inferInsert;

export type JobStatus = NonNullable<ActiveJob["status"]>;
