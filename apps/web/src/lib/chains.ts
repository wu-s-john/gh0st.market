import { defineChain } from "viem";
import { sepolia as sepoliaBase } from "viem/chains";

// RPC URLs from environment variables
const LOCAL_RPC_URL = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || sepoliaBase.rpcUrls.default.http[0];

// Local Anvil chain
export const localhost = defineChain({
  id: 31337,
  name: "Localhost",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: [LOCAL_RPC_URL] },
  },
});

// Sepolia with custom RPC URL
export const sepolia = defineChain({
  ...sepoliaBase,
  rpcUrls: {
    default: { http: [SEPOLIA_RPC_URL] },
  },
});

// All supported chains
export const supportedChains = [localhost, sepolia] as const;

// Chain ID to chain mapping
export const chainById: Record<number, typeof localhost | typeof sepolia> = {
  31337: localhost,
  11155111: sepolia,
};

// Get chain by ID with fallback to Sepolia
export function getChainById(chainId: number) {
  return chainById[chainId] ?? sepolia;
}
