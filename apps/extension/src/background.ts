import {
  type WebToExtensionMessage,
  type ExtensionToWebMessage,
  type StartJobPayload,
  type QueryPayload,
  isWebToExtensionMessage,
} from "./messages/types";
import * as dbService from "./services/db";
import { getWorkerEngine } from "./background/workerEngine";
import { initializeClients, reinitializeClients, isClientsInitialized } from "./background/config";
import { hasConfig } from "./background/configStorage";
import type { WorkerStatus, JobProgress } from "./background/types";

// Extension version from manifest
const EXTENSION_VERSION = "0.0.1";

// Track tabs that have our web app open (for broadcasting updates)
const connectedTabs = new Set<number>();

// Get worker engine instance
const workerEngine = getWorkerEngine();

// ============================================
// Initialize Worker Engine
// ============================================

// Initialize clients and start engine if config exists
async function initializeExtension(): Promise<void> {
  try {
    const configured = await hasConfig();
    if (!configured) {
      console.log("[background] No config found, waiting for setup");
      return;
    }

    const initialized = await initializeClients();
    if (initialized) {
      workerEngine.start();
      console.log("[background] Worker engine started");
    } else {
      console.log("[background] Failed to initialize clients");
    }
  } catch (error) {
    console.error("[background] Initialization error:", error);
  }
}

initializeExtension();

// Subscribe to worker engine events
workerEngine.onStatusChange((status) => {
  // Broadcast to popup
  chrome.runtime.sendMessage({
    type: "WORKER_STATUS_UPDATE",
    status,
  }).catch(() => {});
});

workerEngine.onProgress((progress) => {
  // Broadcast to popup
  chrome.runtime.sendMessage({
    type: "WORKER_PROGRESS_UPDATE",
    progress,
  }).catch(() => {});

  // Also broadcast to web app tabs
  broadcastToTabs({
    type: "GH0ST_JOB_PROGRESS",
    payload: {
      jobId: progress.jobId.toString(),
      status: progress.step as any,
      progress: progress.progress,
      message: progress.message,
    },
  });
});

workerEngine.onJobComplete((result) => {
  if (result.success) {
    broadcastToTabs({
      type: "GH0ST_JOB_COMPLETED",
      payload: {
        jobId: result.jobId.toString(),
        resultPayload: result.resultPayload || "",
        proofData: result.proof?.data || "",
        txHash: result.txHash,
      },
    });
  } else {
    broadcastToTabs({
      type: "GH0ST_JOB_FAILED",
      payload: {
        jobId: result.jobId.toString(),
        error: result.error || "Unknown error",
      },
    });
  }
});

// ============================================
// Popup Message Handlers
// ============================================

function handlePopupMessage(
  message: { type: string; [key: string]: any },
  sendResponse: (response: any) => void
): boolean {
  switch (message.type) {
    case "POPUP_GET_STATUS": {
      sendResponse({ status: workerEngine.getStatus() });
      return false;
    }

    case "POPUP_OPEN_WORKER_TAB": {
      workerEngine.openWorkerTab();
      return false;
    }

    case "POPUP_SET_AUTO_MODE": {
      workerEngine.setAutoMode(message.enabled);
      return false;
    }

    case "POPUP_PROCESS_ONE": {
      workerEngine.processNextJob();
      return false;
    }

    case "POPUP_CONFIG_SAVED": {
      // Reinitialize clients and start engine
      (async () => {
        const initialized = await reinitializeClients();
        if (initialized) {
          workerEngine.start();
          console.log("[background] Clients reinitialized after config save");
        }
      })();
      return false;
    }

    default:
      return false;
  }
}

// ============================================
// Web App Message Handlers
// ============================================

/**
 * Broadcast a message to all connected web app tabs.
 */
async function broadcastToTabs(message: ExtensionToWebMessage): Promise<void> {
  for (const tabId of connectedTabs) {
    try {
      await chrome.tabs.sendMessage(tabId, message);
    } catch {
      // Tab might be closed, remove it
      connectedTabs.delete(tabId);
    }
  }
}

/**
 * Handle database queries from the web app.
 */
async function handleQuery(
  payload: QueryPayload
): Promise<{ data: unknown; error?: string }> {
  try {
    switch (payload.query) {
      case "GET_FOLLOWED_SPECS": {
        const data = await dbService.getFollowedSpecs(payload.walletAddress);
        return { data };
      }
      case "GET_ACTIVE_JOBS": {
        const data = await dbService.getAllActiveJobs();
        return { data };
      }
      case "GET_ACTIVE_JOB": {
        const data = await dbService.getActiveJob(payload.jobId);
        return { data };
      }
      case "GET_JOB_HISTORY": {
        const data = await dbService.getJobHistory(payload.limit);
        return { data };
      }
      default:
        return { data: null, error: "Unknown query type" };
    }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : "Query failed" };
  }
}

/**
 * Update worker engine with approved specs when they change.
 */
async function updateApprovedSpecs(walletAddress: string): Promise<void> {
  const specs = await dbService.getFollowedSpecs(walletAddress);
  const specIds = new Set(specs.map((s) => s.specId));
  const minBountyBySpec = new Map(specs.map((s) => [s.specId, s.minBounty || 0]));
  workerEngine.setApprovedSpecs(specIds, minBountyBySpec);
}

// ============================================
// Message Listener
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Track connected tabs from web app
  if (sender.tab?.id) {
    connectedTabs.add(sender.tab.id);
  }

  // Handle popup messages
  if (message.type?.startsWith("POPUP_")) {
    return handlePopupMessage(message, sendResponse);
  }

  // Handle web app messages
  if (!isWebToExtensionMessage(message)) {
    return false;
  }

  // Handle each message type
  (async () => {
    switch (message.type) {
      case "GH0ST_PING": {
        const response: ExtensionToWebMessage = {
          type: "GH0ST_PONG",
          payload: {
            version: EXTENSION_VERSION,
            walletConnected: false,
          },
        };
        sendResponse(response);
        break;
      }

      case "GH0ST_START_JOB": {
        // For manual job starts from web app, add to queue
        // Note: Auto-discovered jobs go through the listener
        sendResponse({ success: true, message: "Job queued" });
        break;
      }

      case "GH0ST_QUERY": {
        const result = await handleQuery(message.payload);
        const response: ExtensionToWebMessage = {
          type: "GH0ST_QUERY_RESULT",
          payload: {
            query: message.payload.query,
            ...result,
          },
        };
        sendResponse(response);
        break;
      }

      case "GH0ST_FOLLOW_SPEC": {
        await dbService.addFollowedSpec(message.payload);
        // Update worker engine with new specs
        await updateApprovedSpecs(message.payload.walletAddress);
        sendResponse({ success: true });
        break;
      }

      case "GH0ST_UNFOLLOW_SPEC": {
        await dbService.removeFollowedSpec(message.payload.walletAddress, message.payload.specId);
        // Update worker engine
        await updateApprovedSpecs(message.payload.walletAddress);
        sendResponse({ success: true });
        break;
      }

      default:
        sendResponse({ error: "Unknown message type" });
    }
  })();

  // Return true to indicate async response
  return true;
});

// ============================================
// Tab Cleanup
// ============================================

chrome.tabs.onRemoved.addListener((tabId) => {
  connectedTabs.delete(tabId);
});

// Log when background script loads
console.log("[gh0st] Background script loaded with worker engine");
