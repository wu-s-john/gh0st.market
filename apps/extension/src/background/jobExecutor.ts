/**
 * Job Executor - Executes a single job on the worker tab.
 *
 * Steps:
 * 1. Navigate worker tab to mainDomain
 * 2. Wait for page load
 * 3. Make fetch to notarizeUrl with inputs
 * 4. Generate TLS proof (mocked)
 * 5. Submit completeJob to blockchain
 * 6. Wait for tx confirmation
 */

import {
  getPublicClient,
  getWalletClient,
  getContractAddress,
  jobRegistryAbi,
} from "./config";
import type { JobWithSpec, JobProgress, JobResult, JobStep } from "./types";
import type { VlayerProveOutput } from "../schemas/vlayer";

export interface JobExecutorConfig {
  /** Worker tab ID to control */
  workerTabId: number;
  /** Progress callback for UI updates */
  onProgress: (progress: JobProgress) => void;
}

/**
 * Wait for a tab to finish loading.
 */
function waitForTabLoad(tabId: number, timeoutMs = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("Tab load timeout"));
    }, timeoutMs);

    const listener = (
      updatedTabId: number,
      changeInfo: chrome.tabs.TabChangeInfo
    ) => {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
}

/**
 * Send progress update.
 */
function sendProgress(
  config: JobExecutorConfig,
  jobId: bigint,
  step: JobStep,
  progress: number,
  message: string
): void {
  config.onProgress({ jobId, step, progress, message });
}

/**
 * Generate a mock TLS proof.
 * In production, this would use vlayer/TLSNotary.
 */
function generateMockProof(
  responseData: string
): VlayerProveOutput {
  return {
    data: "0x" + Buffer.from(responseData).toString("hex"),
    version: "1.0.0",
    meta: {
      notaryUrl: "https://notary.vlayer.xyz",
    },
  };
}

/**
 * Execute a single job end-to-end.
 */
export async function executeJob(
  job: JobWithSpec,
  config: JobExecutorConfig
): Promise<JobResult> {
  const { jobId, mainDomain, notarizeUrl, inputs } = job;

  console.log(`[jobExecutor] Starting job ${jobId} for ${mainDomain}`);

  try {
    // Step 1: Navigate to main domain
    sendProgress(config, jobId, "navigating", 10, `Navigating to ${mainDomain}...`);

    const url = mainDomain.startsWith("http") ? mainDomain : `https://${mainDomain}`;
    await chrome.tabs.update(config.workerTabId, { url });
    await waitForTabLoad(config.workerTabId);

    sendProgress(config, jobId, "page_loaded", 25, "Page loaded");

    // Small delay to let page fully render
    await new Promise((r) => setTimeout(r, 1000));

    // Step 2: Make fetch request to notarize URL
    sendProgress(config, jobId, "fetching", 40, `Fetching ${notarizeUrl}...`);

    // Parse inputs
    let parsedInputs: Record<string, string> = {};
    try {
      parsedInputs = JSON.parse(inputs);
    } catch {
      parsedInputs = {};
    }

    // Build the actual URL with inputs
    let fetchUrl = notarizeUrl;
    for (const [key, value] of Object.entries(parsedInputs)) {
      fetchUrl = fetchUrl.replace(`{${key}}`, encodeURIComponent(value));
    }

    // Execute fetch in the context of the page via content script
    const fetchResult = await chrome.tabs.sendMessage(config.workerTabId, {
      type: "GH0ST_EXECUTE_FETCH",
      payload: { url: fetchUrl },
    });

    const responseData = fetchResult?.data || JSON.stringify({ success: true, mocked: true });

    // Step 3: Generate TLS proof (mocked)
    sendProgress(config, jobId, "generating_proof", 60, "Generating zk-TLS proof...");

    // Simulate proof generation time
    await new Promise((r) => setTimeout(r, 2000));

    const proof = generateMockProof(responseData);

    sendProgress(config, jobId, "generating_proof", 75, "Proof generated");

    // Step 4: Submit to blockchain
    sendProgress(config, jobId, "submitting_tx", 85, "Submitting to blockchain...");

    const resultPayload = JSON.stringify({
      proof: proof.data,
      response: responseData,
      timestamp: Date.now(),
    });

    const walletClient = getWalletClient();
    const contractAddress = getContractAddress();
    const publicClient = getPublicClient();

    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: jobRegistryAbi,
      functionName: "submitWork",
      args: [jobId, resultPayload],
    });

    sendProgress(config, jobId, "submitting_tx", 90, `Tx submitted: ${txHash.slice(0, 10)}...`);

    // Step 5: Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status === "reverted") {
      throw new Error("Transaction reverted");
    }

    sendProgress(config, jobId, "tx_confirmed", 95, "Transaction confirmed");

    // Step 6: Complete
    sendProgress(config, jobId, "complete", 100, "Job completed successfully");

    console.log(`[jobExecutor] Job ${jobId} completed with tx ${txHash}`);

    return {
      jobId,
      success: true,
      proof,
      resultPayload,
      txHash,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[jobExecutor] Job ${jobId} failed:`, errorMessage);

    sendProgress(config, jobId, "failed", 0, `Failed: ${errorMessage}`);

    return {
      jobId,
      success: false,
      error: errorMessage,
    };
  }
}
