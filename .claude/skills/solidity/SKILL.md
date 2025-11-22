---
name: solidity
description: Expert Solidity + Foundry + RAILGUN + Coinbase CDP development for gh0st.market privacy job board on Ethereum Sepolia
---

# Skill: Solidity + Private Job Board Infra (Foundry + RAILGUN + Coinbase CDP on Ethereum Sepolia)

## 0. Role & Scope

You are an expert Solidity + infra engineer focused on:

- Building privacy-preserving workflows on Ethereum using RAILGUN
- Using Foundry for smart contract development, testing, and deployment
- Wiring those contracts into Coinbase CDP:
  - Embedded Wallets (user-friendly, email-first wallets)
  - Server Wallets (backend-controlled treasury / paymaster)
  - Data APIs for balances, transfers, and onchain analytics

**Target test environment:** Ethereum Sepolia
**Target production chain:** Ethereum mainnet

You should be opinionated about:

- Using RAILGUN for private balances / anonymous payouts
- Using CDP wallets + paymaster to hide crypto UX from end-users
- Using Foundry as the canonical way to build & ship Solidity contracts

---

## 1. Stack Overview

### Chains & Networks

- **Testnet:** Ethereum Sepolia (chainId = 11155111)
  - Good for dev, widely supported by infra, and RAILGUN has contracts deployed on a dedicated Sepolia testnet instance.
- **Mainnet:** Ethereum mainnet

### Core Components

#### Foundry (Paradigm)

Used to:
- Write Solidity contracts (`src/*.sol`)
- Unit test with fuzzing (`test/*.t.sol`)
- Deploy to Ethereum Sepolia & mainnet (`script/*.s.sol`, `forge script`)

Foundry is completely chain-agnostic and plays nicely with RAILGUN + CDP.

#### RAILGUN Wallet SDK

Provides private balances, private transfers, and private DeFi calls on:
- Ethereum, Polygon, BNB Chain, Arbitrum, and a dedicated Sepolia testnet deployment.

You integrate it via the Wallet SDK (TypeScript) to:
- Shield / unshield ERC-20s
- Maintain private 0zk addresses + balances
- Send private transfers
- Execute cross-contract calls privately via the RelayAdapt contracts

#### Coinbase CDP

**Embedded Wallets:**
- User wallets backed by secure key management but UX = email / OAuth login.
- Supports all EVM networks, including Ethereum Sepolia for testnet and Ethereum mainnet for production.

**Server Wallet v2:**
- Programmatic accounts on EVM networks (and Solana) for backend-controlled funds.

**Data APIs:**
- Onchain balances, transfers, prices, and tx history for supported assets (ETH, USDC, etc.).

Supports signing & sending EVM txs on:
- Ethereum, Ethereum Sepolia, Base, Base Sepolia, etc.

**Faucets:**
- Built-in CDP faucet for Ethereum Sepolia for test ETH/USDC.

---

## 2. Foundry: Contract Development on Ethereum Sepolia

### 2.1 Install & Bootstrap

Use Foundry as the canonical Solidity toolkit:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup

forge init privacy-job-board
cd privacy-job-board
```

Update `foundry.toml` to include Ethereum Sepolia:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
evm_version = "cancun"
optimizer = true
optimizer_runs = 200
ffi = true

[rpc_endpoints]
ethereum_sepolia = "${ETH_SEPOLIA_RPC_URL}"
```

### 2.2 Example contract: JobEscrow for the privacy job board

Minimal shape (you'll adapt for RAILGUN integration):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract JobEscrow {
    enum JobStatus { Posted, Submitted, Completed, Cancelled }

    struct Job {
        address requester;        // public EOA or CDP/embedded wallet
        address worker;           // worker address (may just be a withdrawal address)
        uint256 bounty;           // in ERC-20 or native ETH
        JobStatus status;
        bytes32 specHash;         // IPFS / job description hash
        bytes32 resultCommit;     // hash of result (or RAILGUN note id / viewing key)
    }

    uint256 public nextJobId;
    mapping(uint256 => Job) public jobs;

    event JobPosted(uint256 indexed jobId, address indexed requester, uint256 bounty);
    event JobSubmitted(uint256 indexed jobId, address indexed worker, bytes32 resultCommit);
    event JobCompleted(uint256 indexed jobId);
    event JobCancelled(uint256 indexed jobId);

    function postJob(bytes32 specHash) external payable returns (uint256 jobId) {
        require(msg.value > 0, "No bounty");

        jobId = nextJobId++;
        jobs[jobId] = Job({
            requester: msg.sender,
            worker: address(0),
            bounty: msg.value,
            status: JobStatus.Posted,
            specHash: specHash,
            resultCommit: 0
        });

        emit JobPosted(jobId, msg.sender, msg.value);
    }

    function submitResult(uint256 jobId, bytes32 resultCommit) external {
        Job storage job = jobs[jobId];
        require(job.status == JobStatus.Posted, "Not open");
        require(job.worker == address(0) || job.worker == msg.sender, "Worker mismatch");

        job.worker = msg.sender;
        job.resultCommit = resultCommit;
        job.status = JobStatus.Submitted;

        emit JobSubmitted(jobId, msg.sender, resultCommit);
    }

    function approveResult(uint256 jobId, address payoutAddress) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.requester, "Not requester");
        require(job.status == JobStatus.Submitted, "Not submitted");

        job.status = JobStatus.Completed;
        (bool ok, ) = payoutAddress.call{value: job.bounty}("");
        require(ok, "Payout failed");

        emit JobCompleted(jobId);
    }

    function cancelJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        require(msg.sender == job.requester, "Not requester");
        require(job.status == JobStatus.Posted, "Not open");

        job.status = JobStatus.Cancelled;
        (bool ok, ) = job.requester.call{value: job.bounty}("");
        require(ok, "Refund failed");

        emit JobCancelled(jobId);
    }
}
```

You'll later adapt `payoutAddress` to be:
- A RAILGUN unshield address for private payouts, or
- A CDP Embedded Wallet / server wallet address.

### 2.3 Deploy with Foundry to Ethereum Sepolia

Create a simple deploy script `script/DeployJobEscrow.s.sol` and then:

```bash
forge script script/DeployJobEscrow.s.sol:DeployJobEscrow \
  --rpc-url $ETH_SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast
```

The deployed address + ABI from `out/JobEscrow.sol/JobEscrow.json` get reused by RAILGUN (for private interaction) and by Coinbase CDP (for wallet calls).

---

## 3. RAILGUN on Ethereum (Mainnet + Sepolia)

### 3.1 What RAILGUN gives us

RAILGUN is an on-chain ZK privacy system that:

- Lives as contracts directly on Ethereum & other EVM chains (no separate L2 / sidechain).
- Lets users:
  - Shield ERC-20s into a private balance
  - Maintain a 0zk address
  - Transfer privately
  - Perform DeFi / arbitrary contract calls privately via RelayAdapt
- Has a dedicated Sepolia testnet deployment for the privacy system contracts, referenced from the official docs "Helpful Links" page.

### 3.2 Networks & Sepolia support

Main supported networks (as of late 2025):
- Ethereum mainnet
- Polygon
- BNB Chain
- Arbitrum
- RAILGUN privacy system contracts also deployed to **Sepolia Testnet** (for dev).

**Important note for Sepolia:**

- The Wallet SDK examples use `TEST_NETWORK = NetworkName.Polygon` by default, but the SDK itself is generic.
- To use Ethereum Sepolia, you:
  - Configure an EVM network with `chainId = 11155111`
  - Point it at a Sepolia RPC (Alchemy, Infura, etc.)
  - Use the Sepolia RAILGUN privacy system contract address from the docs (Helpful Links page).
- The exact SDK enum may be `NetworkName.Ethereum` plus chain config for Sepolia, or a specific testnet entry depending on version — check `@railgun-community/shared-models` for the current `NetworkName`/`NetworkChainID` definitions.

### 3.3 Installing the RAILGUN Wallet SDK

From the official dev guide:

```bash
yarn add \
  @railgun-community/wallet \
  @railgun-community/shared-models \
  @railgun-community/engine \
  snarkjs \
  @types/snarkjs
```

### 3.4 Initialization (high-level pattern)

From the "Getting Started" and "Networks and RPC providers" docs:

#### 1. Environment constants

```typescript
import { NETWORK_CONFIG, NetworkName } from '@railgun-community/shared-models';
import dotenv from 'dotenv';
dotenv.config();

// For Sepolia you'll likely use a custom network config + RPC.
export const TEST_NETWORK = NetworkName.Ethereum; // logical network
export const TEST_RPC_URL = process.env.RAILGUN_TEST_RPC!; // Sepolia RPC URL

export const TEST_TOKEN =
  NETWORK_CONFIG[TEST_NETWORK].baseToken.wrappedAddress; // e.g., WETH address for that network
export const TEST_MNEMONIC =
  process.env.RAILGUN_TEST_MNEMONIC ??
  'test test test test test test test test test test test junk';

export const TEST_ENCRYPTION_KEY =
  '0101010101010101010101010101010101010101010101010101010101010101'; // dev only
```

For Sepolia, you may need to extend `NETWORK_CONFIG` at runtime or in your forked library to include Sepolia's chainId, base token, and RAILGUN contract addresses.

#### 2. Providers

```typescript
import { JsonRpcProvider, Wallet as EthersWallet } from 'ethers';

export const getProviderWallet = () => {
  const provider = new JsonRpcProvider(TEST_RPC_URL);
  const wallet = EthersWallet.fromPhrase(TEST_MNEMONIC, provider);
  return { provider, wallet };
};
```

#### 3. Start the RAILGUN Engine

The SDK docs show a multi-step init: setting up DB, artifact store, prover, etc., then `startRailgunEngine` and `loadProvider` / `connectEngineNetworkProviders`.

At a high level:

```typescript
import {
  startRailgunEngine,
  loadProvider,
} from '@railgun-community/wallet';
import { ChainType } from '@railgun-community/shared-models';

async function initRailgun() {
  // 1. Provide implementations for DB, artifact store, and logger
  //    (see SDK dev guide for full examples).
  await startRailgunEngine(
    ChainType.EVM,
    /* artifactStore */,       // persistent store for zk artifacts
    /* dbInterface */,         // key-value DB for notes / balances
    /* shouldSkipMerkleScan */ false,
    /* debugLogger */ console.log,
  );

  const { provider } = getProviderWallet();

  // 2. Connect Sepolia provider with RAILGUN Proxy & RelayAdapt contracts
  await loadProvider(
    ChainType.EVM,
    TEST_NETWORK,
    provider,
    /* merkletreeScanCallback */ () => {},
    /* shouldDebug */ true,
  );
}
```

### 3.5 RAILGUN Wallets & Encryption Keys

From the "Private Wallets" section:

- RAILGUN defines two wallet types:
  - **RAILGUN Wallet** – full wallet that can send private transactions and spend tokens.
  - **View-only Wallet** – can view history and balances but not spend.

- Wallets are tied to encryption keys:
  - These protect local note data — losing them means losing access to decrypted history.
  - The docs show "Encryption Keys (new)" which is the recommended flow for generating and using them.

Typical flow (API names may vary slightly by SDK version — treat as pattern):

```typescript
import {
  generateEncryptionKey,
  createRailgunWallet,
  loadRailgunWalletByID,
} from '@railgun-community/wallet';

async function createOrLoadRailgunWallet() {
  const encryptionKey = await generateEncryptionKey(/* user password or entropy */);

  const { railgunWalletID, railgunAddress } = await createRailgunWallet(
    TEST_NETWORK,
    encryptionKey,
    TEST_MNEMONIC,
    /* creationBlockNumber */ 0n, // or a specific starting block
  );

  return { railgunWalletID, railgunAddress, encryptionKey };
}
```

View-only wallet pattern:

```typescript
import { createViewOnlyRailgunWallet } from '@railgun-community/wallet';

async function createViewOnlyWallet(encryptionKey: string, viewingKey: string) {
  const { railgunWalletID } = await createViewOnlyRailgunWallet(
    TEST_NETWORK,
    encryptionKey,
    viewingKey,
  );
  return railgunWalletID;
}
```

Use full RAILGUN wallets for workers (to receive anonymous payouts) and optionally view-only wallets for requesters / dashboards that just need to verify usage or balances.

### 3.6 Private Transfers & Cross-Contract Calls

The Wallet SDK exposes a consistent pattern for any private action:

1. **Estimate gas:** `gasEstimateForUnprovenTransfer` / `gasEstimateForUnprovenCrossContractCalls`
2. **Generate proof:** `generateTransferProof` / `generateCrossContractCallsProof`
3. **Populate tx:** `populateProvedTransfer` / `populateProvedCrossContractCalls`

Cross-contract example skeleton (from docs, adapted):

```typescript
import {
  NETWORK_CONFIG,
  NetworkName,
  TXIDVersion,
  type RailgunERC20Amount,
  type RailgunERC20Recipient,
} from '@railgun-community/shared-models';
import {
  gasEstimateForUnprovenCrossContractCalls,
  generateCrossContractCallsProof,
  populateProvedCrossContractCalls,
} from '@railgun-community/wallet';
import { Contract, type ContractTransaction } from 'ethers';
import { getProviderWallet } from './provider';

const TEST_NETWORK = NetworkName.Ethereum;

export async function privateJobPayout(
  encryptionKey: string,
  railgunWalletID: string,
) {
  const { provider, wallet } = getProviderWallet();

  // Example: private unshield → pay job bounty → shield any dust back

  const TEST_AMOUNT = 1n;

  const erc20AmountUnshieldAmounts: RailgunERC20Amount[] = [
    /* serializeERC20RelayAdaptUnshield(TEST_TOKEN, TEST_AMOUNT) */
  ];

  const erc20ShieldRecipients: RailgunERC20Recipient[] = [
    /* serializeERC20Transfer(TEST_TOKEN, 1n, railgunWalletAddress) */
  ];

  const { wrappedAddress } = NETWORK_CONFIG[TEST_NETWORK].baseToken;
  const weth = new Contract(
    wrappedAddress,
    [
      'function withdraw(uint256)',
      'function balanceOf(address) view returns (uint256)',
    ],
    provider,
  );

  const unwrap = await weth.withdraw.populateTransaction(TEST_AMOUNT);

  const crossContractCalls: ContractTransaction[] = [
    {
      to: unwrap.to!,
      data: unwrap.data!,
      value: 0n,
    },
  ];

  // 1. Estimate gas
  const gasEstimate = await gasEstimateForUnprovenCrossContractCalls(
    TXIDVersion.V2_PoseidonMerkle,
    TEST_NETWORK,
    railgunWalletID,
    encryptionKey,
    erc20AmountUnshieldAmounts,
    [],
    erc20ShieldRecipients,
    [],
    crossContractCalls,
    /* originalGasDetails */ /* getOriginalGasDetailsForTransaction(...) */,
    /* feeTokenDetails */ undefined,
    /* sendWithPublicWallet */ true,
    /* minGasLimit */ 2_500_000n,
  );

  // 2. Generate proof
  await generateCrossContractCallsProof(
    TXIDVersion.V2_PoseidonMerkle,
    TEST_NETWORK,
    railgunWalletID,
    encryptionKey,
    erc20AmountUnshieldAmounts,
    [],
    erc20ShieldRecipients,
    [],
    crossContractCalls,
    /* broadcasterFee */ undefined,
    /* sendWithPublicWallet */ true,
    /* overallBatchMinGasPrice */ 1n,
    /* minGasLimit */ 2_500_000n,
    (progress) => console.log('Proof progress', progress),
  );

  // 3. Populate transaction to send via a public EOA (CDP wallet, etc.)
  const tx = await populateProvedCrossContractCalls(
    TXIDVersion.V2_PoseidonMerkle,
    TEST_NETWORK,
    railgunWalletID,
    erc20AmountUnshieldAmounts,
    [],
    erc20ShieldRecipients,
    [],
    crossContractCalls,
    /* broadcasterFee */ undefined,
    /* sendWithPublicWallet */ true,
    /* overallBatchMinGasPrice */ 1n,
    /* gasDetails */ /* getGasDetailsForTransaction(...) */,
  );

  // Send `tx` using a Coinbase CDP wallet, MetaMask, or any EOA.
  await wallet.sendTransaction(tx);
}
```

In your job board: workers provide a RAILGUN address; payout logic unshields only as needed / or stays private entirely by paying inside RAILGUN.

---

## 4. Coinbase CDP on Ethereum Sepolia

### 4.1 Networks & Support

From Coinbase docs:

**Embedded Wallets:**
- Support "all EVM-compatible networks including Base, Ethereum, Arbitrum, Polygon, Optimism, and more".
- Testnets explicitly include **Ethereum Sepolia**.

**Server Wallet v2:**
- EVM Accounts / Smart Accounts on all EVM networks supported by CDP.

**CDP Core SDK:**
- Sign + send EVM transactions on Ethereum and Ethereum Sepolia.

**Faucets:**
- Provide test ETH/USDC for Ethereum Sepolia.

### 4.2 Embedded Wallets (user wallets, with email login)

High-level flow:

1. Initialize CDP client in your frontend with your project ID & CDP API key (public).
2. Use CDP's auth flow (email / OAuth) to create or load an Embedded Wallet.
3. Directly send EVM transactions from that wallet to your JobEscrow contract on Ethereum Sepolia.

Skeleton TypeScript (shape, not exact):

```typescript
import { createCDPClient } from '@coinbase/cdp-core';
import JobEscrowABI from '../out/JobEscrow.sol/JobEscrow.json';

const JOB_ESCROW_ADDRESS = '0x...'; // from Foundry deployment
const NETWORK_ID = 'ethereum-sepolia'; // CDP network ID

const cdp = createCDPClient({
  apiKey: process.env.NEXT_PUBLIC_CDP_API_KEY!,
  networkId: NETWORK_ID,
});

// 1) Get or create an embedded wallet for the logged-in user
const embeddedWallet = await cdp.embeddedWallets.getDefaultEvmWallet();

// 2) Post a job
async function postJob(specHash: `0x${string}`, bountyWei: bigint) {
  const txData = cdp.evm.encodeFunctionData({
    abi: JobEscrowABI.abi,
    functionName: 'postJob',
    args: [specHash],
  });

  const txHash = await embeddedWallet.send({
    to: JOB_ESCROW_ADDRESS,
    data: txData,
    value: bountyWei,
  });

  return txHash;
}
```

For the hackathon demo, you can make requesters and workers both use Embedded Wallets, but still pay them out via RAILGUN (private) by unshielding from a CDP server wallet into the privacy pool.

### 4.3 Server Wallet v2 (treasury / paymaster)

Backend-side, you use Server Wallet v2 to:

- Hold treasury funds (test ETH/USDC on Ethereum Sepolia)
- Sponsor gas for users (paymaster/smart-account patterns)
- Trigger payouts into RAILGUN or to user EOAs

Example shape (from v2 quickstart):

```typescript
import { CdpClient } from '@coinbase/cdp-sdk';

const client = new CdpClient({
  apiKey: process.env.CDP_API_KEY!,
  apiSecret: process.env.CDP_API_SECRET!,
});

// Create an EVM account on Ethereum Sepolia
const account = await client.wallets.v2.createEvmAccount({
  networkId: 'ethereum-sepolia',
});

// Send ETH to JobEscrow or a RAILGUN public address
await client.wallets.v2.transfer({
  fromAccountId: account.id,
  toAddress: '0xWorkerOrRailgunPublicAddress',
  amount: '0.01',
  assetId: 'eth',
  networkId: 'ethereum-sepolia',
});
```

You can also:
- Use their Faucets API to get testnet ETH for this account on Ethereum Sepolia.
- Wire this into a paymaster pattern for smart accounts (though paid sponsorship is mostly highlighted/tested on Base Sepolia, the general paymaster capability applies more broadly per docs).

### 4.4 Data APIs

Use CDP's Data APIs to:
- Fetch historical transfers from your Server Wallet / treasury
- Check balances of your Embedded Wallets and contract addresses
- Monitor onchain state for your dashboard and compliance

Skeleton:

```typescript
const balances = await client.data.getBalances({
  networkId: 'ethereum-sepolia',
  address: JOB_ESCROW_ADDRESS,
});

const txHistory = await client.data.getTransfers({
  networkId: 'ethereum-sepolia',
  address: JOB_ESCROW_ADDRESS,
});
```

---

## 5. How This Skill Should Use Everything Together

When asked to design or implement features for the privacy job board, follow this architecture:

### Foundry

Use Foundry to:
- Design + test `JobEscrow` and any supporting contracts (e.g. `JobRegistry`, `OracleVerifier`).
- Deploy to Ethereum Sepolia and later to Ethereum mainnet.

Treat Foundry as the source of truth for ABIs and addresses.

### RAILGUN

Use the Wallet SDK for:
- Creating RAILGUN wallets for workers (write-wallets) and for some observers (view-only wallets).
- Shielding payroll funds into RAILGUN
- Paying out bounties privately via shielded transfers or cross-contract calls.

On Ethereum Sepolia:
- Point RAILGUN engine to Sepolia RPC and the Sepolia RAILGUN Privacy System contract.
- Use small amounts of test ETH/USDC for private flow demos.

### Coinbase CDP

Use **Embedded Wallets** so requesters/workers don't need to manage seed phrases or MetaMask:
- They just log in → get an EVM address.
- Use that EVM address to interact with JobEscrow on Ethereum Sepolia.

Use **Server Wallet v2** as:
- Treasury that funds bounties and gas (if doing AA + paymaster).
- Bridge between public funds and RAILGUN private pool (unshield or shield as needed).

Use **Data APIs** to build dashboards & analytics over both job flows and payouts.

### Testing flow

1. **Local logic** = Foundry unit/fuzz tests.
2. **Integration** = Ethereum Sepolia:
   - Deploy contracts (Foundry).
   - Initialize RAILGUN engine (pointing to Sepolia).
   - Use CDP Embedded / Server wallets for actual txs against Sepolia.

---

## 6. RAILGUN Core APIs Reference

### Engine initialization

Use Engine SDK under the hood via Wallet SDK. You must initialize the engine with a LevelDB-compatible store and POI config.

Typical TypeScript pattern:

```typescript
// railgunEngine.ts
import leveljs from 'level-js';
import {
  initializeEngine,
  setOnEngineUpdateCallback,
} from '@railgun-community/wallet';

export async function initRailgunEngine() {
  const db = leveljs('railgun-db'); // browser/indexedDB-compatible store

  await initializeEngine({
    walletSource: 'my-app', // label in private history
    db,
    // Where to download ZK artifact files:
    artifactsDir: '/railgun-artifacts',
    // Private Proof of Innocence aggregators (if using POI)
    poiNodeURLs: ['https://poi.railgun.org'],
    skipMerkletreeScans: false,
  });

  setOnEngineUpdateCallback((status) => {
    console.log('RAILGUN engine status:', status);
  });
}
```

Key options (summarized from docs):
- `walletSource`: string tag visible in private history.
- `db`: LevelDOWN-compatible storage.
- `artifactsDir`: where proving keys / artifacts are cached.
- `poiNodeURLs`: optional aggregator nodes for Private POI.
- `skipMerkletreeScans`: set true only for shield-only apps.

### Creating / loading a RAILGUN wallet

RAILGUN Wallet SDK manages private wallets (0zk addresses) plus view-only wallets.

You typically:
1. Call `createRailgunWallet` once (given a mnemonic / viewing key).
2. Persist `railgunWallet.id` and `encryptionKey`.
3. Use `loadWalletByID` on subsequent app launches.

```typescript
import {
  createRailgunWallet,
  loadWalletByID,
} from '@railgun-community/wallet';

export type StoredRailgunWallet = {
  id: string;
  encryptionKey: string;
};

export async function createNewRailgunWalletFromMnemonic(
  mnemonic: string,
): Promise<StoredRailgunWallet> {
  // This derives a 0zk wallet and stores it in the encrypted DB managed by the engine.
  const { railgunWallet, encryptionKey } = await createRailgunWallet(
    mnemonic,
    undefined, // optional derivation index
  );

  return {
    id: railgunWallet.id,
    encryptionKey,
  };
}

export async function loadExistingRailgunWallet(
  stored: StoredRailgunWallet,
) {
  const wallet = await loadWalletByID(stored.id, stored.encryptionKey);
  return wallet;
}
```

### Updating balances

Use `refreshBalances` to rescan for notes for specific wallets.

```typescript
import {
  refreshBalances,
} from '@railgun-community/wallet';
import { NETWORK_CONFIG, NetworkName } from '@railgun-community/shared-models';

export async function refreshPrivateBalances(railgunWalletID: string) {
  const { chain } = NETWORK_CONFIG[NetworkName.Ethereum];

  await refreshBalances(chain, {
    walletIdFilter: [railgunWalletID],
  });
}
```

---

## 7. RAILGUN Transactions: Shield / Transfer / Unshield

### Shielding ERC-20 / base token

Shielding moves public tokens into a private balance. Docs provide helpers like `gasEstimateForShieldBaseToken` and `populateShieldBaseToken` for base tokens (via wETH), plus ERC-20 variants.

Example: shield small amount of wETH into a RAILGUN wallet:

```typescript
import { Wallet } from 'ethers';
import {
  NETWORK_CONFIG,
  NetworkName,
  TXIDVersion,
  type RailgunERC20AmountRecipient,
} from '@railgun-community/shared-models';
import {
  gasEstimateForShieldBaseToken,
  populateShieldBaseToken,
} from '@railgun-community/wallet';
import { getGasDetailsForTransaction } from './txUtils'; // your helper

export async function shieldBaseToken({
  network,
  publicWallet,
  railgunWalletAddress,
  amountWei,
  tokenAddress, // e.g. wETH
}: {
  network: NetworkName;
  publicWallet: Wallet;
  railgunWalletAddress: string;
  amountWei: bigint;
  tokenAddress: string;
}) {
  const { chain } = NETWORK_CONFIG[network];

  const erc20Recipient: RailgunERC20AmountRecipient = {
    tokenAddress,
    amount: amountWei,
    recipientAddress: railgunWalletAddress,
  };

  // Estimate gas for shield
  const { gasEstimate } = await gasEstimateForShieldBaseToken(
    TXIDVersion.V2_PoseidonMerkle,
    network,
    railgunWalletAddress,
    await publicWallet.getAddress(), // shield signature key derivation can be app-specific
    erc20Recipient,
    await publicWallet.getAddress(),
  );

  const gasDetails = await getGasDetailsForTransaction(
    network,
    gasEstimate,
    true,
    publicWallet,
  );

  // Build transaction
  const { transaction } = await populateShieldBaseToken(
    TXIDVersion.V2_PoseidonMerkle,
    network,
    railgunWalletAddress,
    await publicWallet.getAddress(),
    erc20Recipient,
    gasDetails,
  );

  const txResponse = await publicWallet.sendTransaction(transaction);
  return txResponse.hash;
}
```

In the skill, you don't have to fully reproduce docs; instead, adapt patterns: estimate → populate → send.

### Private transfers

Docs say private transfers require proof generation and optionally Broadcasters; they are encrypted "send" transactions executed through RAILGUN, usually via a Broadcaster for anonymity.

The exact helpers depend on the sub-page (ERC-20 vs NFT). Typical flow:

1. Pick token + amount + recipient 0zk address.
2. Use Wallet SDK transaction helpers to:
   - Estimate gas.
   - Generate proof (e.g., `generateTransferProof`).
   - `populateProvedTransfer` to get `RailgunPopulateTransactionResponse` (transaction, nullifiers, overallBatchMinGasPrice).
3. Submit via Broadcaster (see below) instead of public wallet.

When Claude is asked for concrete code, mirror the patterns from Shielding / Unshielding docs: `gasEstimateFor*`, `generate*Proof`, `populate*` → then feed into Broadcaster.

### Unshielding

Unshielding is encrypted and usually done via a Relayer or Broadcaster; it pulls tokens out of the private pool to a public address and incurs a protocol fee (e.g. 0.25%).

Process is similar to shield:

Use functions like:
- `gasEstimateForUnprovenUnshieldBaseToken`
- `generateUnshieldBaseTokenProof`
- `populateProvedUnshieldBaseToken`

Then either:
- send via public wallet, or
- submit via Broadcaster to hide the destination 0x address.

---

## 8. RAILGUN Broadcasters (Gasless "Paymaster" Layer)

Docs describe Broadcasters as a network of wallets that:
- Submit RAILGUN txs on behalf of users.
- Pay L1 gas from their own account.
- Receive ERC-20 fee from user's private balance (premium + gas).

They're accessed via Waku with `@railgun-community/waku-broadcaster-client-*`.

### Setup Broadcaster client

```typescript
// broadcaster.ts
import {
  NETWORK_CONFIG,
  type NetworkName,
  type SelectedBroadcaster,
  type TransactionGasDetails,
  type FeeTokenDetails,
} from '@railgun-community/shared-models';
import { calculateBroadcasterFeeERC20Amount } from '@railgun-community/wallet';

// dynamic import so you can use node or web package
const wakuModule = import('@railgun-community/waku-broadcaster-client-node');

let WakuBroadcasterClient: any;
let BroadcasterTransaction: any;

async function ensureWaku() {
  const waku = await wakuModule;
  WakuBroadcasterClient = waku.WakuBroadcasterClient;
  BroadcasterTransaction = waku.BroadcasterTransaction;
}

export async function initBroadcasters(network: NetworkName) {
  await ensureWaku();
  const { chain } = NETWORK_CONFIG[network];

  const callback = (chainInfo: any, status: string) => {
    if (status !== 'Connected') {
      console.log(`Waku status ${chainInfo.id}:${chainInfo.type} ${status}`);
    }
  };

  const debugLogger = {
    log: (msg: string) => console.debug('[WAKU]', msg),
    error: (err: Error) => console.error('[WAKU]', err),
  };

  await WakuBroadcasterClient.start(chain, {}, callback, debugLogger);
}
```

### Selecting a Broadcaster + computing fee

```typescript
export async function findBestBroadcasterForToken(
  network: NetworkName,
  tokenAddress: string,
): Promise<SelectedBroadcaster | undefined> {
  const { chain } = NETWORK_CONFIG[network];
  return WakuBroadcasterClient.findBestBroadcaster(chain, tokenAddress, true);
}

export function buildBroadcasterFeeRecipient(
  selectedBroadcaster: SelectedBroadcaster,
  estimatedGasDetails: TransactionGasDetails,
  feeTokenDetails: FeeTokenDetails,
) {
  const feeAmountDetails = calculateBroadcasterFeeERC20Amount(
    feeTokenDetails,
    estimatedGasDetails,
  );

  return {
    tokenAddress: feeAmountDetails.tokenAddress,
    amount: feeAmountDetails.amount,
    recipientAddress: selectedBroadcaster.railgunAddress,
  };
}
```

### Submitting a populated tx via Broadcaster

Docs show that after you get a `RailgunPopulateTransactionResponse` (from Wallet SDK), you can create and send a Broadcaster transaction.

```typescript
import type {
  RailgunPopulateTransactionResponse,
  Chain,
} from '@railgun-community/shared-models';

export async function sendViaBroadcaster({
  populateResponse,
  selectedBroadcaster,
  chain,
  overallBatchMinGasPrice,
  useRelayAdapt,
}: {
  populateResponse: RailgunPopulateTransactionResponse;
  selectedBroadcaster: SelectedBroadcaster;
  chain: Chain;
  overallBatchMinGasPrice: bigint;
  useRelayAdapt: boolean;
}) {
  const nullifiers = populateResponse.nullifiers ?? [];

  const broadcasterTx = await BroadcasterTransaction.create(
    populateResponse.transaction.to,
    populateResponse.transaction.data,
    selectedBroadcaster.railgunAddress,
    selectedBroadcaster.tokenFee.feesID,
    chain,
    nullifiers,
    overallBatchMinGasPrice,
    useRelayAdapt,
  );

  const txHash = await broadcasterTx.send();
  return txHash;
}
```

In any answer involving "gasless anonymous RAILGUN tx", combine:
1. Wallet SDK helpers → `RailgunPopulateTransactionResponse`
2. Broadcaster selection + fee computation
3. `BroadcasterTransaction.create` + `send()`

---

## 9. Combining RAILGUN + Coinbase for the Job Board

For the job-board / privacy workflows you've been designing, this Skill should:

1. Use **Embedded Wallets** for requesters / workers who just log in with email/phone.
2. Use **RAILGUN Shielding** to move funds from those EOAs into private balances.
3. Use **RAILGUN Private Transfers / Cross-Contract Calls** for private settlements and data-access payments.
4. Use **Broadcasters** so workers do not need native gas.
5. For any off-RAILGUN payments or treasury ops on Base, use **Server Wallet + Smart Accounts + paymaster**.

When writing code examples:
- Keep Solidity contracts mostly "vanilla" (ERC-20, job escrow logic, etc.).
- Handle privacy & gasless UX in the TypeScript layer using the SDKs illustrated above.
- If you need more specific flows (e.g., "private job escrow on Polygon + gasless payouts on Base via CDP"), design end-to-end diagrams in text and then show the minimal Solidity + TS pieces needed.

---

## 10. Quick Reference: CDP Embedded Wallets (React)

### React setup

```typescript
// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  CDPReactProvider,
  type Config as CDPConfig,
} from '@coinbase/cdp-react';
import App from './App';
import { CDP_CONFIG } from './config'; // contains projectId, etc.
import { theme } from './theme';

const config: CDPConfig = {
  ...CDP_CONFIG,
  ethereum: {
    createOnLogin: 'eoa', // or 'smart' for smart accounts
  },
  solana: {
    createOnLogin: false,
  },
  appName: 'My Onchain App',
  appLogoUrl: 'https://example.com/logo.png',
  authMethods: ['email', 'sms'],
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CDPReactProvider config={config} theme={theme}>
      <App />
    </CDPReactProvider>
  </StrictMode>,
);
```

### Auth flow

```typescript
// App.tsx
import { useIsInitialized, useIsSignedIn } from '@coinbase/cdp-hooks';
import SignInScreen from './SignInScreen';
import SignedInScreen from './SignedInScreen';

export default function App() {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();

  if (!isInitialized) return <div>Loading...</div>;

  return isSignedIn ? <SignedInScreen /> : <SignInScreen />;
}

// SignInScreen.tsx
import { AuthButton } from '@coinbase/cdp-react/components';

export function SignInScreen() {
  return (
    <main>
      <h1>Welcome</h1>
      <p>Sign in to get your embedded wallet.</p>
      <AuthButton />
    </main>
  );
}
```

### Using the wallet (balances & tx)

```typescript
// SignedInScreen.tsx
import { useEvmAddress, useSendEvmTransaction } from '@coinbase/cdp-hooks';
import { useEffect, useState, useCallback } from 'react';
import { createPublicClient, http, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export function SignedInScreen() {
  const { address: evmAddress } = useEvmAddress();
  const { sendEvmTransaction } = useSendEvmTransaction();
  const [balance, setBalance] = useState<bigint>(0n);
  const [hash, setHash] = useState<string | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!evmAddress) return;
    const bal = await publicClient.getBalance({ address: evmAddress });
    setBalance(bal);
  }, [evmAddress]);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  const handleSend = async () => {
    if (!evmAddress) return;

    const { transactionHash } = await sendEvmTransaction({
      evmAccount: evmAddress,
      network: 'base-sepolia',
      transaction: {
        to: evmAddress,
        value: parseEther('0.000001'),
        chainId: baseSepolia.id,
        type: 'eip1559',
        gas: 21_000n,
      },
    });

    setHash(transactionHash);
    await refreshBalance();
  };

  return (
    <div>
      <p>Address: {evmAddress}</p>
      <p>Balance: {balance.toString()}</p>
      <button onClick={handleSend}>Self-send test tx</button>
      {hash && <p>Tx hash: {hash}</p>}
    </div>
  );
}
```

In answers: use Embedded Wallets to give "web2-style" login, then layer RAILGUN on top (user shields from embedded EOA into RAILGUN).
