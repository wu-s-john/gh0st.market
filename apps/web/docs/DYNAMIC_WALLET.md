# Dynamic Wallet Integration Guide

This document covers the Dynamic SDK integration for gh0st.market, including setup, configuration, and lessons learned.

## Overview

gh0st.market uses [Dynamic](https://www.dynamic.xyz/) for wallet connection. Dynamic provides a unified wallet experience supporting MetaMask, Coinbase Wallet, WalletConnect, and other popular wallets.

## Setup

### 1. Install Dependencies

```bash
pnpm add @dynamic-labs/sdk-react-core @dynamic-labs/ethereum
```

### 2. Environment Variables

Create `.env.local` with your Dynamic environment ID:

```env
DYNAMIC_ENVIRONMENT_ID=your-environment-id-here
```

Get your environment ID from https://app.dynamic.xyz

### 3. Next.js Configuration

Dynamic's environment ID doesn't use the `NEXT_PUBLIC_` prefix, so you must explicitly expose it in `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  transpilePackages: [
    "@dynamic-labs/sdk-react-core",
    "@dynamic-labs/ethereum",
  ],
  env: {
    DYNAMIC_ENVIRONMENT_ID: process.env.DYNAMIC_ENVIRONMENT_ID,
  },
};
```

### 4. Provider Setup

Wrap your app with `DynamicContextProvider`:

```tsx
"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

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
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}
```

## Theming & Customization

### Use the Dashboard Design Editor

**Do NOT attempt to customize Dynamic's appearance via code-based CSS overrides.** The `cssOverrides` prop with `.dynamic-shadow-dom` selectors does not work reliably.

Instead, use the **Dynamic Dashboard Design Editor**:

1. Go to https://app.dynamic.xyz/dashboard/design
2. Customize colors, typography, and styling visually
3. Changes apply automatically to your integration

The Design Editor allows you to:
- Set brand colors (primary, secondary, hover states)
- Configure button styles (background, border radius, shadows)
- Customize modal appearance
- Set typography

### gh0st.market Theme Settings

For reference, gh0st.market uses the "Phantom" color scheme:

| Element | Color |
|---------|-------|
| Accent (Spectral Purple) | `#a78bfa` |
| Background Primary | `#0a0a0f` |
| Background Secondary | `#13131a` |
| Background Tertiary | `#1a1a24` |
| Text Primary | `#e4e4ed` |
| Text Secondary | `#8b8b9b` |
| Border | `#1f1f2e` |

Configure these in the Dashboard Design Editor, not in code.

## Dashboard Configuration

### Disable Email Collection

By default, Dynamic may prompt users for an email after wallet connection. To disable:

1. Go to https://app.dynamic.xyz/dashboard
2. Navigate to **Configurations** > **Log in & User Profile**
3. Disable "Collect user email" or set it to optional

### Other Dashboard Settings

- **Enabled Wallets**: Choose which wallet providers to support
- **Networks**: Configure supported chains
- **Branding**: Upload logos and configure appearance

## Common Issues

### Environment Variable Not Available

**Problem**: `process.env.DYNAMIC_ENVIRONMENT_ID` is undefined in the browser.

**Solution**: Add the `env` block to `next.config.ts`:

```ts
env: {
  DYNAMIC_ENVIRONMENT_ID: process.env.DYNAMIC_ENVIRONMENT_ID,
},
```

### CSS Overrides Not Working

**Problem**: Attempted `cssOverrides` with various selectors (`.dynamic-shadow-dom`, direct class targeting, etc.) have no effect.

**Solution**: Don't use code-based CSS overrides. Use the Dynamic Dashboard Design Editor at https://app.dynamic.xyz/dashboard/design instead.

### Email Prompt After Wallet Connect

**Problem**: Users are prompted for their email address after connecting their wallet.

**Solution**: This is controlled via the Dynamic dashboard, not code. Go to Configurations > Log in & User Profile and disable email collection.

## Hooks & Utilities

Dynamic provides useful hooks for wallet state:

```tsx
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

function MyComponent() {
  const { primaryWallet, user, handleLogOut } = useDynamicContext();

  if (!primaryWallet) {
    return <DynamicWidget />; // Shows connect button
  }

  return (
    <div>
      Connected: {primaryWallet.address}
      <button onClick={handleLogOut}>Disconnect</button>
    </div>
  );
}
```

## Resources

- [Dynamic Docs](https://docs.dynamic.xyz/)
- [Dynamic Dashboard](https://app.dynamic.xyz/)
- [Design Editor](https://app.dynamic.xyz/dashboard/design)
- [CSS Variables Reference](https://docs.dynamic.xyz/design-customizations/css/css-variables)
