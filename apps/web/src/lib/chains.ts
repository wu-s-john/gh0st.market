import { defineChain } from "viem";
import { sepolia } from "viem/chains";
import { CHAIN_ID } from "./contracts.generated";

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
    default: { http: ["http://127.0.0.1:8545"] },
  },
});

// All supported chains
export const supportedChains = [localhost, sepolia] as const;

// Get active chain based on generated config
export function getActiveChain() {
  return CHAIN_ID === 31337 ? localhost : sepolia;
}

// Chain ID to chain mapping
export const chainById = {
  31337: localhost,
  11155111: sepolia,
} as const;
