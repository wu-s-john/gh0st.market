"use client";

import { useMemo, useState } from "react";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sepolia } from "viem/chains";
import { localhost } from "@/lib/chains";

// NOTE: Dynamic theming is configured via the Dashboard Design Editor
// at https://app.dynamic.xyz/dashboard/design - NOT via code.
// See apps/web/docs/DYNAMIC_WALLET.md for details.

// EVM Networks for Dynamic (both localhost and Sepolia)
const evmNetworks = [
  {
    blockExplorerUrls: [""],
    chainId: 31337,
    chainName: "Localhost",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/eth.svg"],
    name: "Localhost",
    nativeCurrency: {
      decimals: 18,
      name: "Ether",
      symbol: "ETH",
    },
    networkId: 31337,
    rpcUrls: ["http://127.0.0.1:8545"],
    vanityName: "Localhost",
  },
  {
    blockExplorerUrls: ["https://sepolia.etherscan.io/"],
    chainId: 11155111,
    chainName: "Ethereum Sepolia",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/eth.svg"],
    name: "Sepolia",
    nativeCurrency: {
      decimals: 18,
      name: "Ether",
      symbol: "ETH",
    },
    networkId: 11155111,
    rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
    vanityName: "Sepolia",
  },
];

// Wagmi config with both chains - user can switch via wallet
const wagmiConfig = createConfig({
  chains: [localhost, sepolia],
  multiInjectedProviderDiscovery: false,
  transports: {
    [localhost.id]: http("http://127.0.0.1:8545"),
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
  },
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // Memoize settings to prevent Dynamic SDK reinitialization on re-renders
  const settings = useMemo(
    () => ({
      environmentId: process.env.DYNAMIC_ENVIRONMENT_ID ?? "",
      walletConnectors: [EthereumWalletConnectors],
      overrides: {
        evmNetworks,
      },
    }),
    []
  );

  // Use useState to ensure QueryClient persists across re-renders
  const [queryClient] = useState(() => new QueryClient());

  return (
    <DynamicContextProvider settings={settings}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            {children}
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}
