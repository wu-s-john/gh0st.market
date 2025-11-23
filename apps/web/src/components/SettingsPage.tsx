"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui";
import { useChainSettings } from "@/hooks/useSettings";
import { CHAIN_CONFIG, SUPPORTED_CHAIN_IDS } from "@/lib/contracts.config";
import { chainById } from "@/lib/chains";
import { Role } from "@/lib/navigation";

interface SettingsPageProps {
  role: Role;
}

const CHAIN_NAMES: Record<number, string> = {
  31337: "Localhost (Anvil)",
  11155111: "Sepolia Testnet",
};

export function SettingsPage({ role }: SettingsPageProps) {
  const { chain } = useAccount();
  const currentChainId = chain?.id ?? 11155111;
  const { settings, isCustom, updateSettings, resetSettings, defaultSettings } = useChainSettings(currentChainId);

  const [registryAddress, setRegistryAddress] = useState("");
  const [deploymentBlock, setDeploymentBlock] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");

  // Load current settings when chain changes
  useEffect(() => {
    setRegistryAddress(settings.jobRegistryAddress);
    setDeploymentBlock(settings.deploymentBlock.toString());
    setError("");
  }, [settings, currentChainId]);

  const handleSave = () => {
    setError("");

    // Validate address format
    if (!registryAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError("Invalid contract address format. Must be 0x followed by 40 hex characters.");
      return;
    }

    // Validate deployment block
    const blockNum = parseInt(deploymentBlock, 10);
    if (isNaN(blockNum) || blockNum < 0) {
      setError("Invalid deployment block. Must be a non-negative number.");
      return;
    }

    updateSettings({
      jobRegistryAddress: registryAddress as `0x${string}`,
      deploymentBlock: BigInt(blockNum),
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    resetSettings();
    setRegistryAddress(defaultSettings.jobRegistryAddress);
    setDeploymentBlock(defaultSettings.deploymentBlock.toString());
    setError("");
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const isModified =
    registryAddress !== settings.jobRegistryAddress ||
    deploymentBlock !== settings.deploymentBlock.toString();

  return (
    <DashboardLayout role={role}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-jetbrains-mono)] text-2xl font-bold text-[var(--text-primary)] mb-2">
          Settings
        </h1>
        <p className="text-[var(--text-secondary)]">
          Configure contract addresses per chain
        </p>
      </div>

      {/* Current Chain Info */}
      <div className="mb-6 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-[var(--text-primary)] font-medium">
            Connected to: {CHAIN_NAMES[currentChainId] || `Chain ${currentChainId}`}
          </span>
          {isCustom && (
            <span className="px-2 py-0.5 text-xs bg-[var(--accent)]/20 text-[var(--accent)] rounded">
              Custom Config
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Settings below apply to the currently connected chain. Switch chains in your wallet to configure other networks.
        </p>
      </div>

      {/* Settings Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-semibold text-[var(--text-primary)]">
            Contract Configuration
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Configure the JobRegistry contract address for {CHAIN_NAMES[currentChainId] || `Chain ${currentChainId}`}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Registry Address */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              JobRegistry Contract Address
            </label>
            <input
              type="text"
              value={registryAddress}
              onChange={(e) => setRegistryAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] font-[family-name:var(--font-jetbrains-mono)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Default: {defaultSettings.jobRegistryAddress}
            </p>
          </div>

          {/* Deployment Block */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Deployment Block
            </label>
            <input
              type="text"
              value={deploymentBlock}
              onChange={(e) => setDeploymentBlock(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] font-[family-name:var(--font-jetbrains-mono)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Block number when the contract was deployed. Used for efficient event log queries.
              Default: {defaultSettings.deploymentBlock.toString()}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {isSaved && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400">Settings saved successfully!</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={!isModified}
            >
              Save Changes
            </Button>
            <Button
              variant="ghost"
              onClick={handleReset}
              disabled={!isCustom}
            >
              Reset to Default
            </Button>
          </div>
        </div>
      </div>

      {/* All Chains Overview */}
      <div className="mt-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h3 className="font-[family-name:var(--font-jetbrains-mono)] text-sm font-semibold text-[var(--text-primary)]">
            All Configured Chains
          </h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {SUPPORTED_CHAIN_IDS.map((chainId) => {
              const config = CHAIN_CONFIG[chainId];
              const isActive = chainId === currentChainId;
              return (
                <div
                  key={chainId}
                  className={`p-3 rounded-lg border ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border)] bg-[var(--surface-2)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {CHAIN_NAMES[chainId]}
                    </span>
                    {isActive && (
                      <span className="text-xs text-[var(--accent)]">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-[family-name:var(--font-jetbrains-mono)] mt-1">
                    {config.jobRegistryAddress}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
