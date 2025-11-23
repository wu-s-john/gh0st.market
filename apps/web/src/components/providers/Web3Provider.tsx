"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

// gh0st.market Phantom theme - CSS overrides for Dynamic SDK
const cssOverrides = `
  .dynamic-shadow-dom {
    /* Typography */
    --dynamic-font-family-primary: 'Outfit', sans-serif;
    --dynamic-font-family-numbers: 'JetBrains Mono', monospace;

    /* Base Colors (dark backgrounds) */
    --dynamic-base-1: #0a0a0f;
    --dynamic-base-2: #13131a;
    --dynamic-base-3: #1a1a24;
    --dynamic-base-4: #1f1f2e;
    --dynamic-base-5: #2d2d3d;

    /* Text Colors */
    --dynamic-text-primary: #e4e4ed;
    --dynamic-text-secondary: #8b8b9b;
    --dynamic-text-tertiary: #5b5b6b;
    --dynamic-text-link: #a78bfa;

    /* Brand Colors (Spectral Purple) */
    --dynamic-brand-primary-color: #a78bfa;
    --dynamic-brand-secondary-color: #7c5fcf;
    --dynamic-brand-hover-color: #b99cff;

    /* Status Colors */
    --dynamic-connection-green: #34d399;
    --dynamic-error-1: #f87171;
    --dynamic-error-2: #1a1a24;
    --dynamic-success-1: #34d399;
    --dynamic-success-2: #1a1a24;

    /* Hover & Overlay */
    --dynamic-hover: #1a1a24;
    --dynamic-overlay: rgba(10, 10, 15, 0.8);

    /* Connect Button */
    --dynamic-connect-button-background: #a78bfa;
    --dynamic-connect-button-color: #ffffff;
    --dynamic-connect-button-radius: 6px;
    --dynamic-connect-button-border: none;
    --dynamic-connect-button-shadow: 0 0 20px rgba(167, 139, 250, 0.3);
    --dynamic-connect-button-background-hover: #b99cff;
    --dynamic-connect-button-color-hover: #ffffff;
    --dynamic-connect-button-shadow-hover: 0 0 30px rgba(167, 139, 250, 0.5);

    /* Modal */
    --dynamic-modal-width: 400px;
    --dynamic-modal-border: 1px solid #1f1f2e;
    --dynamic-modal-backdrop-background: rgba(10, 10, 15, 0.8);
    --dynamic-border-radius: 8px;

    /* Wallet List */
    --dynamic-wallet-list-tile-background: #13131a;
    --dynamic-wallet-list-tile-background-hover: #1a1a24;
    --dynamic-wallet-list-tile-border: 1px solid #1f1f2e;
    --dynamic-wallet-list-tile-border-hover: 1px solid #2d2d3d;

    /* Search Bar */
    --dynamic-search-bar-background: #13131a;
    --dynamic-search-bar-background-hover: #1a1a24;
    --dynamic-search-bar-background-focus: #1a1a24;
    --dynamic-search-bar-border: 1px solid #1f1f2e;
    --dynamic-search-bar-border-hover: 1px solid #2d2d3d;
    --dynamic-search-bar-border-focus: 1px solid #a78bfa;

    /* Footer */
    --dynamic-footer-background-color: #0a0a0f;
    --dynamic-footer-text-color: #5b5b6b;
    --dynamic-footer-border: 1px solid #1f1f2e;

    /* Badge */
    --dynamic-badge-background: #1a1a24;
    --dynamic-badge-color: #8b8b9b;
    --dynamic-badge-dot-background: #a78bfa;
    --dynamic-badge-primary-background: #a78bfa;
    --dynamic-badge-primary-color: #ffffff;

    /* Shadows */
    --dynamic-shadow-down-1: 0 4px 12px rgba(0, 0, 0, 0.4);
    --dynamic-shadow-down-2: 0 8px 24px rgba(0, 0, 0, 0.5);
    --dynamic-shadow-down-3: 0 0 30px rgba(167, 139, 250, 0.1);
  }
`;

const evmNetworks = [
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

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.DYNAMIC_ENVIRONMENT_ID ?? "",
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks,
        },
        cssOverrides,
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}
