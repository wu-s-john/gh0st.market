/**
 * Config Storage Service
 *
 * Manages user-provided configuration stored in chrome.storage.local.
 * This allows users to configure their own RPC endpoint, contract address,
 * and worker private key without hardcoding.
 */

export interface ExtensionConfig {
  /** Chain ID (31337 for localhost, 11155111 for Sepolia) */
  chainId: number;
  /** RPC endpoint URL (e.g., https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY) */
  rpcUrl: string;
  /** JobRegistry contract address */
  contractAddress: `0x${string}`;
  /** Worker private key for signing transactions */
  workerPrivateKey: `0x${string}`;
  /** Timestamp when config was saved */
  savedAt: number;
}

const STORAGE_KEY = "gh0st_config";

/**
 * Check if config exists in storage.
 */
export async function hasConfig(): Promise<boolean> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return !!result[STORAGE_KEY];
}

/**
 * Get config from storage.
 * Returns null if not configured.
 */
export async function getConfig(): Promise<ExtensionConfig | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || null;
}

/**
 * Save config to storage.
 */
export async function saveConfig(config: Omit<ExtensionConfig, "savedAt">): Promise<void> {
  const fullConfig: ExtensionConfig = {
    ...config,
    savedAt: Date.now(),
  };
  await chrome.storage.local.set({ [STORAGE_KEY]: fullConfig });
  console.log("[configStorage] Config saved");
}

/**
 * Clear config from storage.
 */
export async function clearConfig(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
  console.log("[configStorage] Config cleared");
}

// Supported chain IDs
export const SUPPORTED_CHAIN_IDS = [31337, 11155111] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

/**
 * Validate config values.
 * Returns an object with validation errors, or empty object if valid.
 */
export function validateConfig(config: Partial<ExtensionConfig>): Record<string, string> {
  const errors: Record<string, string> = {};

  // Validate chain ID
  if (!config.chainId) {
    errors.chainId = "Chain ID is required";
  } else if (!SUPPORTED_CHAIN_IDS.includes(config.chainId as SupportedChainId)) {
    errors.chainId = `Unsupported chain ID. Supported: ${SUPPORTED_CHAIN_IDS.join(", ")}`;
  }

  // Validate RPC URL
  if (!config.rpcUrl) {
    errors.rpcUrl = "RPC URL is required";
  } else {
    try {
      new URL(config.rpcUrl);
    } catch {
      errors.rpcUrl = "Invalid URL format";
    }
  }

  // Validate contract address
  if (!config.contractAddress) {
    errors.contractAddress = "Contract address is required";
  } else if (!/^0x[a-fA-F0-9]{40}$/.test(config.contractAddress)) {
    errors.contractAddress = "Invalid Ethereum address format";
  }

  // Validate private key
  if (!config.workerPrivateKey) {
    errors.workerPrivateKey = "Private key is required";
  } else if (!/^0x[a-fA-F0-9]{64}$/.test(config.workerPrivateKey)) {
    errors.workerPrivateKey = "Invalid private key format (should be 0x + 64 hex chars)";
  }

  return errors;
}

/**
 * Subscribe to config changes.
 */
export function onConfigChange(callback: (config: ExtensionConfig | null) => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === "local" && STORAGE_KEY in changes) {
      callback(changes[STORAGE_KEY].newValue || null);
    }
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
