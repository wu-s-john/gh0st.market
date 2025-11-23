import type { JobStatus, FollowedSpec, ActiveJob } from "../db/schema";

// ============================================
// Message Identifiers
// ============================================

/** Prefix for all gh0st.market extension messages */
export const MESSAGE_PREFIX = "GH0ST_" as const;

// ============================================
// Web App -> Extension Messages
// ============================================

/** Check if extension is installed and get version */
export interface PingMessage {
  type: "GH0ST_PING";
}

/** Start a new job in the extension */
export interface StartJobMessage {
  type: "GH0ST_START_JOB";
  payload: StartJobPayload;
}

export interface StartJobPayload {
  jobId: string;
  specId: number;
  mainDomain: string;
  notarizeUrl: string; // URL with placeholders resolved
  inputs: Record<string, string>;
  promptInstructions: string;
  outputSchema: string;
  bounty: string;
  token: string;
}

/** Query the extension database */
export interface QueryMessage {
  type: "GH0ST_QUERY";
  payload: QueryPayload;
}

export type QueryPayload =
  | { query: "GET_FOLLOWED_SPECS"; walletAddress: string }
  | { query: "GET_ACTIVE_JOBS" }
  | { query: "GET_ACTIVE_JOB"; jobId: string }
  | { query: "GET_JOB_HISTORY"; limit?: number };

/** Add a followed spec */
export interface FollowSpecMessage {
  type: "GH0ST_FOLLOW_SPEC";
  payload: {
    specId: number;
    walletAddress: string;
    mainDomain: string;
    minBounty?: number;
    autoClaim?: boolean;
  };
}

/** Remove a followed spec */
export interface UnfollowSpecMessage {
  type: "GH0ST_UNFOLLOW_SPEC";
  payload: {
    specId: number;
    walletAddress: string;
  };
}

/** All messages from web app to extension */
export type WebToExtensionMessage =
  | PingMessage
  | StartJobMessage
  | QueryMessage
  | FollowSpecMessage
  | UnfollowSpecMessage;

// ============================================
// Extension -> Web App Messages
// ============================================

/** Response to ping - extension is installed */
export interface PongMessage {
  type: "GH0ST_PONG";
  payload: {
    version: string;
    walletConnected?: boolean;
  };
}

/** Job has been accepted and started */
export interface JobStartedMessage {
  type: "GH0ST_JOB_STARTED";
  payload: {
    jobId: string;
  };
}

/** Job progress update */
export interface JobProgressMessage {
  type: "GH0ST_JOB_PROGRESS";
  payload: {
    jobId: string;
    status: JobStatus;
    progress: number; // 0-100
    message?: string;
  };
}

/** Job completed successfully */
export interface JobCompletedMessage {
  type: "GH0ST_JOB_COMPLETED";
  payload: {
    jobId: string;
    resultPayload: string;
    proofData: string;
    txHash?: string;
  };
}

/** Job failed */
export interface JobFailedMessage {
  type: "GH0ST_JOB_FAILED";
  payload: {
    jobId: string;
    error: string;
  };
}

/** Response to a query */
export interface QueryResultMessage {
  type: "GH0ST_QUERY_RESULT";
  payload: {
    query: QueryPayload["query"];
    data: unknown;
    error?: string;
  };
}

/** Extension status broadcast */
export interface ExtensionStatusMessage {
  type: "GH0ST_EXTENSION_STATUS";
  payload: ExtensionStatusPayload;
}

export interface ExtensionStatusPayload {
  connected: boolean;
  version: string;
  walletAddress?: string;
  activeJob?: {
    jobId: string;
    specDomain: string;
    status: JobStatus;
    progress: number;
  };
}

/** All messages from extension to web app */
export type ExtensionToWebMessage =
  | PongMessage
  | JobStartedMessage
  | JobProgressMessage
  | JobCompletedMessage
  | JobFailedMessage
  | QueryResultMessage
  | ExtensionStatusMessage;

// ============================================
// Combined Types
// ============================================

export type ExtensionMessage = WebToExtensionMessage | ExtensionToWebMessage;

// ============================================
// Type Guards
// ============================================

export function isExtensionMessage(data: unknown): data is ExtensionMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    typeof (data as { type: unknown }).type === "string" &&
    (data as { type: string }).type.startsWith(MESSAGE_PREFIX)
  );
}

export function isWebToExtensionMessage(data: unknown): data is WebToExtensionMessage {
  if (!isExtensionMessage(data)) return false;
  const type = data.type;
  return (
    type === "GH0ST_PING" ||
    type === "GH0ST_START_JOB" ||
    type === "GH0ST_QUERY" ||
    type === "GH0ST_FOLLOW_SPEC" ||
    type === "GH0ST_UNFOLLOW_SPEC"
  );
}

export function isExtensionToWebMessage(data: unknown): data is ExtensionToWebMessage {
  if (!isExtensionMessage(data)) return false;
  const type = data.type;
  return (
    type === "GH0ST_PONG" ||
    type === "GH0ST_JOB_STARTED" ||
    type === "GH0ST_JOB_PROGRESS" ||
    type === "GH0ST_JOB_COMPLETED" ||
    type === "GH0ST_JOB_FAILED" ||
    type === "GH0ST_QUERY_RESULT" ||
    type === "GH0ST_EXTENSION_STATUS"
  );
}
