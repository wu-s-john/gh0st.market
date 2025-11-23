# Local Testing Guide

Test the JobRegistry smart contracts locally using Anvil.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- [just](https://github.com/casey/just#installation) command runner installed

## Step 1: Start Local Environment

Start Anvil and deploy all contracts with a single command (from project root):

```bash
just eth-dev
```

This will:
1. Build contracts
2. Start Anvil (local Ethereum node)
3. Deploy ProofVerifier and JobRegistry

You'll see output like:

```
ProofVerifier deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
JobRegistry deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

**Keep this terminal running.**

## Step 2: Set Environment Variables

Open a **new terminal** and set up your environment:

```bash
# Anvil's default RPC URL
export RPC_URL=http://127.0.0.1:8545

# Use Anvil's first test account (has 10000 ETH)
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Use second account as worker
export WORKER_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
export WORKER=0x70997970C51812dc3A010C7d01b50e0d17dc79C8

# Set deployed contract addresses (from Step 1 output)
export REGISTRY=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

## Step 3: Create a JobSpec

Create a job specification template (7 fields: mainDomain, notarizeUrl, description, promptInstructions, outputSchema, inputSchema, validationRules):

```bash
cast send $REGISTRY "createJobSpec((string,string,string,string,string,string,string))" \
  '("crunchbase.com","https://crunchbase.com/org/{{company}}","Fetch funding data","Extract company info","{}","{}","")' \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

Verify the spec was created:

```bash
cast call $REGISTRY "getJobSpecCount()" --rpc-url $RPC_URL
```

Expected output: `0x0000000000000000000000000000000000000000000000000000000000000001` (= 1)

## Step 4: Create a Job with ETH Bounty

Create a job referencing specId=0 with 0.001 ETH bounty:

```bash
cast send $REGISTRY "createJob((uint256,string,address,uint256,string))" \
  "(0,\"company:Anthropic\",0x0000000000000000000000000000000000000000,1000000000000000,\"\")" \
  --value 0.001ether \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

Verify the job was created:

```bash
cast call $REGISTRY "getJobCount()" --rpc-url $RPC_URL
```

Expected output: `0x0000000000000000000000000000000000000000000000000000000000000001` (= 1)

Check the contract balance (should have 0.001 ETH escrowed):

```bash
cast balance $REGISTRY --rpc-url $RPC_URL
```

Expected output: `1000000000000000` (= 0.001 ETH in wei)

## Step 5: Submit Work and Get Paid

Check worker's balance before:

```bash
cast balance $WORKER --rpc-url $RPC_URL
```

Submit work as the worker (jobId=0, mock proof works since verifier always returns true):

```bash
cast send $REGISTRY "submitWork(uint256,string,bytes,address)" \
  0 "funding:1500000000" 0x1234 $WORKER \
  --rpc-url $RPC_URL \
  --private-key $WORKER_KEY
```

Check worker's balance after (should increase by ~0.001 ETH minus gas):

```bash
cast balance $WORKER --rpc-url $RPC_URL
```

Verify the contract escrow is empty:

```bash
cast balance $REGISTRY --rpc-url $RPC_URL
```

Expected output: `0`

## Troubleshooting

### "Connection refused"
Make sure Anvil is running. Run `just eth-dev` in another terminal.

### "Execution reverted"
Check the error message. Common issues:
- `InvalidSpec()` - spec ID doesn't exist
- `InvalidBounty()` - bounty is 0 or ETH value doesn't match
- `JobNotOpen()` - job already completed

### View transaction details
```bash
cast tx <TX_HASH> --rpc-url $RPC_URL
cast receipt <TX_HASH> --rpc-url $RPC_URL
```

### Reset Anvil state
Stop Anvil (Ctrl+C) and run `just eth-dev` again. All state is reset.

## Just Commands Reference

| Command | Description |
|---------|-------------|
| `just eth-dev` | Start Anvil + deploy + generate wagmi bindings |
| `just eth-stop` | Stop running Anvil process |
| `just eth-build` | Build contracts |
| `just eth-test` | Run all tests |
| `just eth-deploy-local` | Deploy to running Anvil |
| `just eth-deploy-sepolia` | Deploy to Sepolia testnet |
| `just eth-fund <address>` | Fund wallet with 100 ETH (local only) |
| `just eth-clean` | Clean build artifacts |
| `just eth-fmt` | Format Solidity files |
| `just generate-bindings` | Regenerate wagmi TypeScript bindings |
