/**
 * Job Runner Content Script
 *
 * This content script runs on ALL pages to execute job tasks.
 * It handles fetch requests from the background script during job execution.
 */

import type { PlasmoCSConfig } from "plasmo";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_idle",
};

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GH0ST_EXECUTE_FETCH") {
    handleFetchRequest(message.payload.url)
      .then((data) => sendResponse({ data }))
      .catch((error) =>
        sendResponse({ data: null, error: error.message })
      );
    return true; // Async response
  }

  if (message.type === "GH0ST_GET_PAGE_INFO") {
    sendResponse({
      url: window.location.href,
      title: document.title,
      readyState: document.readyState,
    });
    return false;
  }

  return false;
});

/**
 * Execute a fetch request in the context of the current page.
 * This allows the request to use the page's cookies/session.
 */
async function handleFetchRequest(url: string): Promise<string> {
  console.log("[jobRunner] Executing fetch:", url);

  try {
    const response = await fetch(url, {
      credentials: "include", // Include cookies
      headers: {
        Accept: "application/json, text/plain, */*",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    let data: string;

    if (contentType.includes("application/json")) {
      const json = await response.json();
      data = JSON.stringify(json);
    } else {
      data = await response.text();
    }

    console.log("[jobRunner] Fetch complete, data length:", data.length);
    return data;
  } catch (error) {
    console.error("[jobRunner] Fetch failed:", error);
    throw error;
  }
}

console.log("[jobRunner] Content script loaded on:", window.location.hostname);
