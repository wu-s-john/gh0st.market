"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";

/**
 * Worker Runner Page
 *
 * This page is controlled by the Chrome extension's worker engine.
 * When the extension executes jobs, it navigates this tab to target sites.
 * When idle, this page shows the worker status.
 */

interface JobLog {
  id: string;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error";
}

export default function WorkerRunnerPage() {
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [isExtensionConnected, setIsExtensionConnected] = useState(false);

  useEffect(() => {
    // Check if extension is connected
    const checkExtension = () => {
      window.postMessage({ type: "GH0ST_PING" }, "*");
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) return;

      const data = event.data;
      if (!data?.type?.startsWith("GH0ST_")) return;

      if (data.type === "GH0ST_PONG") {
        setIsExtensionConnected(true);
        addLog("Extension connected", "success");
      }

      if (data.type === "GH0ST_JOB_PROGRESS") {
        addLog(data.payload.message || data.payload.status, "info");
      }

      if (data.type === "GH0ST_JOB_COMPLETED") {
        addLog(`Job ${data.payload.jobId} completed!`, "success");
      }

      if (data.type === "GH0ST_JOB_FAILED") {
        addLog(`Job ${data.payload.jobId} failed: ${data.payload.error}`, "error");
      }
    };

    window.addEventListener("message", handleMessage);
    checkExtension();

    // Periodic ping
    const interval = setInterval(checkExtension, 5000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(interval);
    };
  }, []);

  const addLog = (message: string, type: JobLog["type"]) => {
    setLogs((prev) => [
      {
        id: Math.random().toString(36).slice(2),
        timestamp: new Date(),
        message,
        type,
      },
      ...prev.slice(0, 49), // Keep last 50 logs
    ]);
  };

  return (
    <DashboardLayout role="worker">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-[var(--text-primary)] mb-2">
              Worker Runner
            </h1>
            <p className="text-[var(--text-secondary)]">
              This tab is controlled by the gh0st.market extension
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isExtensionConnected ? "bg-[var(--success)]" : "bg-[var(--error)]"
              }`}
            />
            <span className="text-sm text-[var(--text-secondary)]">
              {isExtensionConnected ? "Extension Connected" : "Extension Not Found"}
            </span>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[var(--accent)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                />
              </svg>
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-semibold text-[var(--text-primary)]">
                Worker Active
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Ready to execute jobs. The extension will navigate this tab to target sites.
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 mb-6">
          <h3 className="font-[family-name:var(--font-jetbrains-mono)] text-base font-semibold text-[var(--text-primary)] mb-4">
            How it works
          </h3>
          <ol className="space-y-3 text-sm text-[var(--text-secondary)]">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] flex items-center justify-center text-xs">
                1
              </span>
              <span>
                When jobs are available, the extension will navigate this tab to the target website
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] flex items-center justify-center text-xs">
                2
              </span>
              <span>
                The extension collects the required data and generates a zk-TLS proof
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] flex items-center justify-center text-xs">
                3
              </span>
              <span>
                The proof is submitted to the blockchain and you earn the bounty
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] flex items-center justify-center text-xs">
                4
              </span>
              <span>
                Keep this tab open and the extension will process jobs automatically
              </span>
            </li>
          </ol>
        </div>

        {/* Activity Log */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h3 className="font-[family-name:var(--font-jetbrains-mono)] text-base font-semibold text-[var(--text-primary)]">
              Activity Log
            </h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="px-6 py-8 text-center text-[var(--text-muted)]">
                No activity yet. Waiting for jobs...
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {logs.map((log) => (
                  <li key={log.id} className="px-6 py-3 flex items-start gap-3">
                    <span
                      className={`flex-shrink-0 w-2 h-2 mt-1.5 rounded-full ${
                        log.type === "success"
                          ? "bg-[var(--success)]"
                          : log.type === "error"
                          ? "bg-[var(--error)]"
                          : "bg-[var(--accent)]"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)]">{log.message}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {log.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
