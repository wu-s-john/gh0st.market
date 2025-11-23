/**
 * Chain-based contract configuration
 *
 * Contract addresses are stored per chain ID.
 * RPC URLs come from environment variables.
 *
 * Updated by:
 * - `just watch-frontend-dev <address>` for local development
 * - `just eth-deploy-local` for local anvil
 * - `just eth-deploy-sepolia` for Sepolia testnet
 */

export interface ChainContractConfig {
  jobRegistryAddress: `0x${string}`;
  deploymentBlock: bigint;
}

/**
 * Contract addresses per chain
 * Keys are chain IDs (31337 = local, 11155111 = Sepolia)
 */
export const CHAIN_CONFIG: Record<number, ChainContractConfig> = {
  // Local Anvil - updated by watch-frontend-dev or eth-deploy-local
  31337: {
    jobRegistryAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    deploymentBlock: BigInt(2),
  },
  // Sepolia Testnet - updated by eth-deploy-sepolia
  11155111: {
    jobRegistryAddress: "0x7d35a1baea3e78a5af90f2f0e8dde992738557fb",
    deploymentBlock: BigInt(9689420),
  },
};

/**
 * Supported chain IDs
 */
export const SUPPORTED_CHAIN_IDS = [31337, 11155111] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

/**
 * Get contract config for a specific chain
 */
export function getChainConfig(chainId: number): ChainContractConfig | undefined {
  return CHAIN_CONFIG[chainId];
}

/**
 * Get contract config for a chain, with fallback to Sepolia
 */
export function getChainConfigOrDefault(chainId: number): ChainContractConfig {
  return CHAIN_CONFIG[chainId] ?? CHAIN_CONFIG[11155111];
}

/**
 * Check if a chain is supported
 */
export function isChainSupported(chainId: number): chainId is SupportedChainId {
  return chainId in CHAIN_CONFIG;
}
