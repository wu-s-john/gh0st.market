/**
 * Blockchain configuration for the extension.
 *
 * Uses lazy initialization - clients are created only after
 * user provides config via the setup flow.
 *
 * Supports multiple chains (localhost/Sepolia) based on user config.
 */

import { createPublicClient, createWalletClient, http, parseAbiItem, defineChain, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { getConfig, type ExtensionConfig } from "./configStorage";

// ============================================
// Chain Definitions
// ============================================

const localhost = defineChain({
  id: 31337,
  name: "Localhost",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
});

const chainById: Record<number, Chain> = {
  31337: localhost,
  11155111: sepolia,
};

function getChainById(chainId: number): Chain {
  return chainById[chainId] ?? sepolia;
}

// ============================================
// State
// ============================================

let isInitialized = false;
let currentConfig: ExtensionConfig | null = null;

// Lazy-initialized clients
let _publicClient: ReturnType<typeof createPublicClient> | null = null;
let _walletClient: ReturnType<typeof createWalletClient> | null = null;
let _workerAddress: `0x${string}` | null = null;
let _contractAddress: `0x${string}` | null = null;
let _chainId: number | null = null;

// Polling interval for job listener (ms)
export const POLLING_INTERVAL = 10_000; // 10 seconds

// ============================================
// Initialization
// ============================================

/**
 * Initialize clients with the stored config.
 * Must be called before using any clients.
 */
export async function initializeClients(): Promise<boolean> {
  const config = await getConfig();

  if (!config) {
    console.log("[config] No config found, clients not initialized");
    isInitialized = false;
    return false;
  }

  try {
    currentConfig = config;
    _contractAddress = config.contractAddress;
    _chainId = config.chainId;

    // Get the chain based on configured chainId
    const chain = getChainById(config.chainId);

    // Create public client
    _publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    });

    // Create wallet client
    const account = privateKeyToAccount(config.workerPrivateKey);
    _walletClient = createWalletClient({
      account,
      chain,
      transport: http(config.rpcUrl),
    });
    _workerAddress = account.address;

    isInitialized = true;
    console.log(`[config] Clients initialized for chain ${config.chainId} with worker:`, _workerAddress);
    return true;
  } catch (error) {
    console.error("[config] Failed to initialize clients:", error);
    isInitialized = false;
    return false;
  }
}

/**
 * Re-initialize clients (e.g., after config change).
 */
export async function reinitializeClients(): Promise<boolean> {
  isInitialized = false;
  _publicClient = null;
  _walletClient = null;
  _workerAddress = null;
  _contractAddress = null;
  _chainId = null;
  return initializeClients();
}

/**
 * Check if clients are initialized.
 */
export function isClientsInitialized(): boolean {
  return isInitialized;
}

// ============================================
// Client Getters (throw if not initialized)
// ============================================

export function getPublicClient() {
  if (!_publicClient) {
    throw new Error("Clients not initialized. Call initializeClients() first.");
  }
  return _publicClient;
}

export function getWalletClient() {
  if (!_walletClient) {
    throw new Error("Clients not initialized. Call initializeClients() first.");
  }
  return _walletClient;
}

export function getWorkerAddress(): `0x${string}` {
  if (!_workerAddress) {
    throw new Error("Clients not initialized. Call initializeClients() first.");
  }
  return _workerAddress;
}

export function getContractAddress(): `0x${string}` {
  if (!_contractAddress) {
    throw new Error("Clients not initialized. Call initializeClients() first.");
  }
  return _contractAddress;
}

export function getChainId(): number {
  if (!_chainId) {
    throw new Error("Clients not initialized. Call initializeClients() first.");
  }
  return _chainId;
}

// ============================================
// Events
// ============================================

export const JobCreatedEvent = parseAbiItem(
  "event JobCreated(uint256 indexed jobId, uint256 indexed specId, address indexed requester, address token, uint256 bounty)"
);

// ============================================
// Contract ABI (minimal)
// ============================================

export const jobRegistryAbi = [
  {
    type: "function",
    name: "getJob",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "specId", type: "uint256" },
          { name: "inputs", type: "string" },
          { name: "requesterContact", type: "string" },
          { name: "token", type: "address" },
          { name: "bounty", type: "uint256" },
          { name: "requester", type: "address" },
          { name: "status", type: "uint8" },
          { name: "createdAt", type: "uint256" },
          { name: "completedAt", type: "uint256" },
          { name: "resultPayload", type: "string" },
          { name: "worker", type: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getJobSpec",
    inputs: [{ name: "specId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "mainDomain", type: "string" },
          { name: "notarizeUrl", type: "string" },
          { name: "description", type: "string" },
          { name: "promptInstructions", type: "string" },
          { name: "outputSchema", type: "string" },
          { name: "inputSchema", type: "string" },
          { name: "validationRules", type: "string" },
          { name: "creator", type: "address" },
          { name: "createdAt", type: "uint256" },
          { name: "active", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getJobCount",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "submitWork",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "resultPayload", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
