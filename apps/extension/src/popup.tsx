import { useEffect, useState } from "react";
import type { WorkerStatus, JobProgress } from "./background/types";
import {
  getConfig,
  saveConfig,
  validateConfig,
  hasConfig,
  type ExtensionConfig,
} from "./background/configStorage";

import "./style.css";

// ============================================
// Setup Screen Component
// ============================================

function SetupScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [rpcUrl, setRpcUrl] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [workerPrivateKey, setWorkerPrivateKey] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const config = {
      rpcUrl,
      contractAddress: contractAddress as `0x${string}`,
      workerPrivateKey: workerPrivateKey as `0x${string}`,
    };

    const validationErrors = validateConfig(config);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      await saveConfig(config);
      // Notify background script to reinitialize
      chrome.runtime.sendMessage({ type: "POPUP_CONFIG_SAVED" });
      onComplete();
    } catch (error) {
      setErrors({ general: "Failed to save configuration" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="popup">
      <div className="popup-header">
        <span className="popup-logo">gh0st.market</span>
      </div>

      <div className="setup-content">
        <h2 className="setup-title">Setup Required</h2>
        <p className="setup-description">
          Configure your worker settings to start processing jobs.
        </p>

        <div className="setup-form">
          <div className="form-field">
            <label className="form-label">RPC Endpoint URL</label>
            <input
              type="text"
              className={`form-input ${errors.rpcUrl ? "error" : ""}`}
              placeholder="https://eth-sepolia.g.alchemy.com/v2/..."
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
            />
            {errors.rpcUrl && <span className="form-error">{errors.rpcUrl}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Contract Address</label>
            <input
              type="text"
              className={`form-input ${errors.contractAddress ? "error" : ""}`}
              placeholder="0x..."
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
            />
            {errors.contractAddress && (
              <span className="form-error">{errors.contractAddress}</span>
            )}
          </div>

          <div className="form-field">
            <label className="form-label">Worker Private Key</label>
            <input
              type="password"
              className={`form-input ${errors.workerPrivateKey ? "error" : ""}`}
              placeholder="0x..."
              value={workerPrivateKey}
              onChange={(e) => setWorkerPrivateKey(e.target.value)}
            />
            {errors.workerPrivateKey && (
              <span className="form-error">{errors.workerPrivateKey}</span>
            )}
            <span className="form-hint">
              This key is stored locally and used to sign job submissions.
            </span>
          </div>

          {errors.general && (
            <div className="form-error-general">{errors.general}</div>
          )}

          <button
            className="popup-button primary full-width"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Popup Component
// ============================================

function WorkerPanel({
  status,
  progress,
  onReset,
}: {
  status: WorkerStatus;
  progress: JobProgress | null;
  onReset: () => void;
}) {
  const handleOpenWorkerTab = () => {
    chrome.runtime.sendMessage({ type: "POPUP_OPEN_WORKER_TAB" });
  };

  const handleToggleAutoMode = () => {
    chrome.runtime.sendMessage({
      type: "POPUP_SET_AUTO_MODE",
      enabled: !status.autoMode,
    });
  };

  const handleProcessOne = () => {
    chrome.runtime.sendMessage({ type: "POPUP_PROCESS_ONE" });
  };

  // Worker tab closed state
  if (!status.workerTabOpen) {
    return (
      <div className="popup">
        <div className="popup-header">
          <span className="popup-logo">gh0st.market</span>
          <button className="settings-button" onClick={onReset} title="Settings">
            <svg className="settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
        <div className="popup-content">
          <div className="popup-jobs-count">
            <span className="count">{status.queueLength}</span>
            <span className="label">jobs available</span>
          </div>
          <button className="popup-button primary" onClick={handleOpenWorkerTab}>
            Open Worker Tab
          </button>
          <p className="popup-hint">
            Worker tab closed. Open it to start processing jobs.
          </p>
        </div>
      </div>
    );
  }

  // Worker tab open state
  return (
    <div className="popup">
      <div className="popup-header">
        <span className="popup-logo">gh0st.market</span>
        <button className="settings-button" onClick={onReset} title="Settings">
          <svg className="settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      </div>

      <div className="popup-stats">
        <div className="stat">
          <span className="stat-value">{status.queueLength}</span>
          <span className="stat-label">Available</span>
        </div>
        <div className="stat current-job">
          {status.currentJob ? (
            <>
              <span className="stat-value">#{status.currentJob.jobId.toString()}</span>
              <span className="stat-label">{status.currentJob.mainDomain}</span>
            </>
          ) : (
            <>
              <span className="stat-value">--</span>
              <span className="stat-label">No active job</span>
            </>
          )}
        </div>
        <div className="stat">
          <button
            className={`toggle ${status.autoMode ? "on" : "off"}`}
            onClick={handleToggleAutoMode}
          >
            <span className="toggle-knob" />
          </button>
          <span className="stat-label">{status.autoMode ? "Auto ON" : "Auto OFF"}</span>
        </div>
      </div>

      {/* Progress bar when job is running */}
      {status.currentJob && status.currentStep && (
        <div className="popup-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${status.currentProgress}%` }}
            />
          </div>
          <span className="progress-label">
            {progress?.message || status.currentStep}
          </span>
        </div>
      )}

      <div className="popup-actions">
        <button className="popup-button secondary" onClick={handleOpenWorkerTab}>
          Focus Tab
        </button>
        {!status.autoMode && status.queueLength > 0 && !status.currentJob && (
          <button className="popup-button primary" onClick={handleProcessOne}>
            Process Next
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Root Popup Component
// ============================================

function Popup() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [status, setStatus] = useState<WorkerStatus | null>(null);
  const [progress, setProgress] = useState<JobProgress | null>(null);

  useEffect(() => {
    // Check if config exists
    hasConfig().then((configured) => {
      setIsConfigured(configured);
      if (configured) {
        // Get initial status
        chrome.runtime.sendMessage({ type: "POPUP_GET_STATUS" }, (response) => {
          if (response?.status) {
            setStatus(response.status);
          }
        });
      }
    });

    // Listen for status updates
    const listener = (message: unknown) => {
      if (typeof message === "object" && message !== null) {
        const msg = message as { type: string; status?: WorkerStatus; progress?: JobProgress };
        if (msg.type === "WORKER_STATUS_UPDATE" && msg.status) {
          setStatus(msg.status);
        }
        if (msg.type === "WORKER_PROGRESS_UPDATE" && msg.progress) {
          setProgress(msg.progress);
        }
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleSetupComplete = () => {
    setIsConfigured(true);
    // Get initial status after config is saved
    chrome.runtime.sendMessage({ type: "POPUP_GET_STATUS" }, (response) => {
      if (response?.status) {
        setStatus(response.status);
      }
    });
  };

  const handleResetConfig = () => {
    setIsConfigured(false);
  };

  // Loading state
  if (isConfigured === null) {
    return (
      <div className="popup">
        <div className="popup-header">
          <span className="popup-logo">gh0st.market</span>
        </div>
        <div className="popup-loading">Loading...</div>
      </div>
    );
  }

  // Setup required
  if (!isConfigured) {
    return <SetupScreen onComplete={handleSetupComplete} />;
  }

  // Waiting for status
  if (!status) {
    return (
      <div className="popup">
        <div className="popup-header">
          <span className="popup-logo">gh0st.market</span>
        </div>
        <div className="popup-loading">Connecting...</div>
      </div>
    );
  }

  return (
    <WorkerPanel
      status={status}
      progress={progress}
      onReset={handleResetConfig}
    />
  );
}

export default Popup;
