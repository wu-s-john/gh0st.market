/**
 * Message types for web app <-> extension communication.
 * These mirror the types in the extension's messages/types.ts.
 */

export const MESSAGE_PREFIX = "GH0ST_" as const;

// ============================================
// Job Status Types
// ============================================

export type JobStatus =
  | "pending"
  | "navigating"
  | "collecting"
  | "generating_proof"
  | "submitting"
  | "completed"
  | "failed";

// ============================================
// Web App -> Extension Messages
// ============================================

export interface StartJobPayload {
  jobId: string;
  specId: number;
  mainDomain: string;
  notarizeUrl: string;
  inputs: Record<string, string>;
  promptInstructions: string;
  outputSchema: string;
  bounty: string;
  token: string;
}

export type WebToExtensionMessage =
  | { type: "GH0ST_PING" }
  | { type: "GH0ST_START_JOB"; payload: StartJobPayload }
  | { type: "GH0ST_QUERY"; payload: QueryPayload }
  | { type: "GH0ST_FOLLOW_SPEC"; payload: FollowSpecPayload }
  | { type: "GH0ST_UNFOLLOW_SPEC"; payload: { specId: number; walletAddress: string } };

export type QueryPayload =
  | { query: "GET_FOLLOWED_SPECS"; walletAddress: string }
  | { query: "GET_ACTIVE_JOBS" }
  | { query: "GET_ACTIVE_JOB"; jobId: string }
  | { query: "GET_JOB_HISTORY"; limit?: number };

export interface FollowSpecPayload {
  specId: number;
  walletAddress: string;
  mainDomain: string;
  minBounty?: number;
  autoClaim?: boolean;
}

// ============================================
// Extension -> Web App Messages
// ============================================

export type ExtensionToWebMessage =
  | { type: "GH0ST_PONG"; payload: { version: string; walletConnected?: boolean } }
  | { type: "GH0ST_EXTENSION_READY"; payload: { timestamp: number } }
  | { type: "GH0ST_JOB_STARTED"; payload: { jobId: string } }
  | { type: "GH0ST_JOB_PROGRESS"; payload: JobProgressPayload }
  | { type: "GH0ST_JOB_COMPLETED"; payload: JobCompletedPayload }
  | { type: "GH0ST_JOB_FAILED"; payload: { jobId: string; error: string } }
  | { type: "GH0ST_QUERY_RESULT"; payload: QueryResultPayload }
  | { type: "GH0ST_ERROR"; payload: { originalType: string; error: string } };

export interface JobProgressPayload {
  jobId: string;
  status: JobStatus;
  progress: number;
  message?: string;
}

export interface JobCompletedPayload {
  jobId: string;
  resultPayload: string;
  proofData: string;
  txHash?: string;
}

export interface QueryResultPayload {
  query: string;
  data: unknown;
  error?: string;
}

// ============================================
// Type Guards
// ============================================

export function isExtensionMessage(data: unknown): data is ExtensionToWebMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    typeof (data as { type: unknown }).type === "string" &&
    (data as { type: string }).type.startsWith(MESSAGE_PREFIX)
  );
}

// ============================================
// Message Sending Utilities
// ============================================

/**
 * Send a message to the extension via window.postMessage.
 * The extension's content script will relay it to the background script.
 */
export function sendToExtension(message: WebToExtensionMessage): void {
  window.postMessage(message, "*");
}

/**
 * Send a message and wait for a response.
 * @param message The message to send
 * @param timeout Timeout in milliseconds (default: 5000)
 * @returns Promise that resolves with the response or rejects on timeout
 */
export function sendToExtensionWithResponse<T extends ExtensionToWebMessage>(
  message: WebToExtensionMessage,
  expectedType: T["type"],
  timeout = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error(`Extension response timeout for ${message.type}`));
    }, timeout);

    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;

      const response = event.data;
      if (!isExtensionMessage(response)) return;

      if (response.type === expectedType) {
        clearTimeout(timeoutId);
        window.removeEventListener("message", handler);
        resolve(response as T);
      } else if (response.type === "GH0ST_ERROR") {
        clearTimeout(timeoutId);
        window.removeEventListener("message", handler);
        reject(new Error(response.payload.error));
      }
    };

    window.addEventListener("message", handler);
    sendToExtension(message);
  });
}

/**
 * Check if the extension is installed by sending a ping.
 */
export async function checkExtensionInstalled(): Promise<{
  installed: boolean;
  version?: string;
}> {
  try {
    const response = await sendToExtensionWithResponse<
      Extract<ExtensionToWebMessage, { type: "GH0ST_PONG" }>
    >({ type: "GH0ST_PING" }, "GH0ST_PONG", 1000);

    return {
      installed: true,
      version: response.payload.version,
    };
  } catch {
    return { installed: false };
  }
}

/**
 * Subscribe to extension messages.
 * @param callback Function to call when a message is received
 * @returns Unsubscribe function
 */
export function subscribeToExtension(
  callback: (message: ExtensionToWebMessage) => void
): () => void {
  const handler = (event: MessageEvent) => {
    if (event.source !== window) return;
    if (isExtensionMessage(event.data)) {
      callback(event.data);
    }
  };

  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}
