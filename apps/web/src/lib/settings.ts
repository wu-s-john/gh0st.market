/**
 * Settings store with localStorage persistence
 * Allows per-chain contract address overrides
 *
 * Priority order:
 * 1. localStorage (user-configured via Settings page, per chain)
 * 2. Defaults from contracts.config.ts
 */

import { CHAIN_CONFIG, type ChainContractConfig } from "./contracts.config";

const SETTINGS_KEY = "gh0st_chain_settings";

export interface ChainSettings {
  jobRegistryAddress: `0x${string}`;
  deploymentBlock: bigint;
}

type StoredChainSettings = Record<string, {
  jobRegistryAddress: string;
  deploymentBlock: string;
}>;

/**
 * Get settings for a specific chain from localStorage or defaults
 */
export function getChainSettings(chainId: number): ChainSettings {
  const defaults = getDefaultChainSettings(chainId);

  if (typeof window === "undefined") {
    return defaults;
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return defaults;

    const parsed: StoredChainSettings = JSON.parse(stored);
    const chainSettings = parsed[chainId.toString()];

    if (!chainSettings) return defaults;

    return {
      jobRegistryAddress: (chainSettings.jobRegistryAddress as `0x${string}`) || defaults.jobRegistryAddress,
      deploymentBlock: chainSettings.deploymentBlock ? BigInt(chainSettings.deploymentBlock) : defaults.deploymentBlock,
    };
  } catch {
    return defaults;
  }
}

/**
 * Save settings for a specific chain to localStorage
 */
export function saveChainSettings(chainId: number, settings: Partial<ChainSettings>): void {
  if (typeof window === "undefined") return;

  const current = getChainSettings(chainId);
  const updated = {
    ...current,
    ...settings,
  };

  // Load all stored settings
  let allSettings: StoredChainSettings = {};
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      allSettings = JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }

  // Update this chain's settings
  allSettings[chainId.toString()] = {
    jobRegistryAddress: updated.jobRegistryAddress,
    deploymentBlock: updated.deploymentBlock.toString(),
  };

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(allSettings));

  // Dispatch event for reactive updates
  window.dispatchEvent(new CustomEvent("chain-settings-changed", {
    detail: { chainId, settings: updated },
  }));
}

/**
 * Reset settings for a specific chain to defaults
 */
export function resetChainSettings(chainId: number): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const allSettings: StoredChainSettings = JSON.parse(stored);
      delete allSettings[chainId.toString()];
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(allSettings));
    }
  } catch {
    // Ignore errors
  }

  const defaults = getDefaultChainSettings(chainId);
  window.dispatchEvent(new CustomEvent("chain-settings-changed", {
    detail: { chainId, settings: defaults },
  }));
}

/**
 * Get default settings for a chain from contracts.config.ts
 */
export function getDefaultChainSettings(chainId: number): ChainSettings {
  const config = CHAIN_CONFIG[chainId];
  if (config) {
    return {
      jobRegistryAddress: config.jobRegistryAddress,
      deploymentBlock: config.deploymentBlock,
    };
  }

  // Fallback to Sepolia if chain not found
  const sepoliaConfig = CHAIN_CONFIG[11155111];
  return {
    jobRegistryAddress: sepoliaConfig.jobRegistryAddress,
    deploymentBlock: sepoliaConfig.deploymentBlock,
  };
}

/**
 * Check if a chain has custom settings (overridden from defaults)
 */
export function hasCustomSettings(chainId: number): boolean {
  if (typeof window === "undefined") return false;

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return false;

    const parsed: StoredChainSettings = JSON.parse(stored);
    return chainId.toString() in parsed;
  } catch {
    return false;
  }
}
