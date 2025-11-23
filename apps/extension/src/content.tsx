import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"

import { isWebToExtensionMessage, isExtensionToWebMessage } from "./messages/types"
import type { ExtensionToWebMessage } from "./messages/types"

export const config: PlasmoCSConfig = {
  // Only inject on gh0st.market pages (update for production domain)
  matches: ["http://localhost:3000/*", "https://gh0st.market/*", "https://*.gh0st.market/*"]
}

/**
 * Generates a style element with adjusted CSS to work correctly within a Shadow DOM.
 */
export const getStyle = (): HTMLStyleElement => {
  const baseFontSize = 16

  let updatedCssText = cssText.replaceAll(":root", ":host(plasmo-csui)")
  const remRegex = /([\d.]+)rem/g
  updatedCssText = updatedCssText.replace(remRegex, (match, remValue) => {
    const pixelsValue = parseFloat(remValue) * baseFontSize
    return `${pixelsValue}px`
  })

  const styleElement = document.createElement("style")
  styleElement.textContent = updatedCssText
  return styleElement
}

/**
 * Set up message relay between web page and extension background script.
 * This runs once when the content script loads.
 */
function setupMessageRelay() {
  // Listen for messages from the web page
  window.addEventListener("message", async (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return

    const message = event.data

    // Check if it's a message intended for the extension
    if (!isWebToExtensionMessage(message)) return

    console.log("[gh0st-content] Relaying message to background:", message.type)

    try {
      // Send to background script and wait for response
      const response = await chrome.runtime.sendMessage(message)

      // Relay response back to the page
      if (response) {
        window.postMessage(response, "*")
      }
    } catch (error) {
      console.error("[gh0st-content] Error relaying message:", error)

      // Send error back to page
      window.postMessage(
        {
          type: "GH0ST_ERROR",
          payload: {
            originalType: message.type,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        },
        "*"
      )
    }
  })

  // Listen for broadcasts from background script (e.g., job progress updates)
  chrome.runtime.onMessage.addListener((message: ExtensionToWebMessage) => {
    if (isExtensionToWebMessage(message)) {
      console.log("[gh0st-content] Broadcasting to page:", message.type)
      window.postMessage(message, "*")
    }
  })

  // Announce that extension is ready
  window.postMessage(
    {
      type: "GH0ST_EXTENSION_READY",
      payload: { timestamp: Date.now() },
    },
    "*"
  )

  console.log("[gh0st-content] Message relay initialized")
}

// Initialize message relay when content script loads
setupMessageRelay()

/**
 * Minimal overlay component - can be expanded to show job status, etc.
 */
const PlasmoOverlay = () => {
  const [activeJobCount, setActiveJobCount] = useState(0)

  useEffect(() => {
    // Listen for job updates to show indicator
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) return

      const message = event.data
      if (message?.type === "GH0ST_JOB_STARTED") {
        setActiveJobCount((prev) => prev + 1)
      } else if (message?.type === "GH0ST_JOB_COMPLETED" || message?.type === "GH0ST_JOB_FAILED") {
        setActiveJobCount((prev) => Math.max(0, prev - 1))
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  // Only show if there are active jobs
  if (activeJobCount === 0) return null

  return (
    <div className="plasmo-z-50 plasmo-fixed plasmo-bottom-4 plasmo-right-4">
      <div className="plasmo-bg-purple-600 plasmo-text-white plasmo-px-3 plasmo-py-2 plasmo-rounded-lg plasmo-shadow-lg plasmo-flex plasmo-items-center plasmo-gap-2">
        <span className="plasmo-w-2 plasmo-h-2 plasmo-rounded-full plasmo-bg-white plasmo-animate-pulse" />
        <span className="plasmo-text-sm plasmo-font-medium">
          {activeJobCount} job{activeJobCount > 1 ? "s" : ""} running
        </span>
      </div>
    </div>
  )
}

export default PlasmoOverlay
