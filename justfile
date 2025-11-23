# JobRegistry Development Commands
# Usage: just <command>

# Load environment variables from .env
set dotenv-load
set dotenv-filename := ".env"

# Default anvil test account (first pre-funded account with 10,000 ETH)
export LOCAL_ETH_PRIVATE_KEY1 := "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
export RPC_URL := "http://127.0.0.1:8545"

# Start Anvil and deploy all contracts (local dev environment)
eth-dev:
    #!/usr/bin/env bash
    set -e
    cd contracts

    echo "Building contracts..."
    forge build

    echo "Starting Anvil in background..."
    anvil &
    ANVIL_PID=$!

    # Wait for Anvil to be ready
    sleep 2

    echo "Deploying contracts..."
    forge script script/DeployJobRegistry.s.sol \
        --rpc-url {{RPC_URL}} \
        --private-key {{LOCAL_ETH_PRIVATE_KEY1}} \
        --broadcast

    # Extract deployed address and update chain config
    REGISTRY_ADDRESS=$(cat broadcast/DeployJobRegistry.s.sol/31337/run-latest.json | jq -r '.transactions[1].contractAddress')
    BLOCK_NUMBER=$(cat broadcast/DeployJobRegistry.s.sol/31337/run-latest.json | jq -r '.receipts[1].blockNumber' | xargs printf "%d")

    # Update chain config
    cd ..
    node scripts/update-chain-config.js 31337 "$REGISTRY_ADDRESS" "$BLOCK_NUMBER"

    # Generate wagmi TypeScript bindings
    echo "Generating wagmi bindings..."
    cd apps/web && pnpm generate

    echo ""
    echo "============================================"
    echo "Local dev environment ready!"
    echo "Anvil PID: $ANVIL_PID"
    echo "RPC URL: {{RPC_URL}}"
    echo "JobRegistry: $REGISTRY_ADDRESS"
    echo "============================================"
    echo ""
    echo "Press Ctrl+C to stop Anvil"

    # Keep script running, forward signals to Anvil
    trap "kill $ANVIL_PID 2>/dev/null" EXIT
    wait $ANVIL_PID

# Build contracts
eth-build:
    cd contracts && forge build

# Run contract tests
eth-test:
    cd contracts && forge test -vvv

# Deploy to local Anvil (assumes Anvil is already running)
eth-deploy-local:
    #!/usr/bin/env bash
    set -e
    cd contracts
    forge script script/DeployJobRegistry.s.sol \
        --rpc-url {{RPC_URL}} \
        --private-key {{LOCAL_ETH_PRIVATE_KEY1}} \
        --broadcast

    # Extract deployed address from broadcast artifacts
    REGISTRY_ADDRESS=$(cat broadcast/DeployJobRegistry.s.sol/31337/run-latest.json | jq -r '.transactions[0].contractAddress')
    BLOCK_NUMBER=$(cat broadcast/DeployJobRegistry.s.sol/31337/run-latest.json | jq -r '.receipts[0].blockNumber' | xargs printf "%d")

    # Update chain config
    cd ..
    node scripts/update-chain-config.js 31337 "$REGISTRY_ADDRESS" "$BLOCK_NUMBER"

    echo ""
    echo "Updated chain config for localhost (31337):"
    echo "  JobRegistry: $REGISTRY_ADDRESS"
    echo "  Block: $BLOCK_NUMBER"

# Deploy to Sepolia (requires SEPOLIA_RPC_URL env var and 'deployer' keystore)
# First run: cast wallet import deployer --interactive
eth-deploy-sepolia:
    #!/usr/bin/env bash
    set -e

    if [ -z "$SEPOLIA_RPC_URL" ]; then
        echo "Error: SEPOLIA_RPC_URL environment variable not set"
        echo "Add it to your .env file or export it"
        exit 1
    fi

    cd contracts
    forge script script/DeployJobRegistry.s.sol \
        --rpc-url "$SEPOLIA_RPC_URL" \
        --account deployer \
        --broadcast

    # Extract deployed address from broadcast artifacts
    REGISTRY_ADDRESS=$(cat broadcast/DeployJobRegistry.s.sol/11155111/run-latest.json | jq -r '.transactions[0].contractAddress')
    BLOCK_NUMBER=$(cat broadcast/DeployJobRegistry.s.sol/11155111/run-latest.json | jq -r '.receipts[0].blockNumber' | xargs printf "%d")

    # Update chain config
    cd ..
    node scripts/update-chain-config.js 11155111 "$REGISTRY_ADDRESS" "$BLOCK_NUMBER"

    echo ""
    echo "Updated chain config for Sepolia (11155111):"
    echo "  JobRegistry: $REGISTRY_ADDRESS"
    echo "  Block: $BLOCK_NUMBER"

# Fund a wallet with ETH from Anvil's test account (local only)
eth-fund address amount="100ether":
    cast send {{address}} --value {{amount}} --private-key {{LOCAL_ETH_PRIVATE_KEY1}} --rpc-url {{RPC_URL}}

# Stop any running Anvil process
eth-stop:
    #!/usr/bin/env bash
    if pgrep -x "anvil" > /dev/null; then
        echo "Stopping Anvil..."
        pkill -x "anvil"
        echo "Anvil stopped"
    else
        echo "No Anvil process running"
    fi

# Clean build artifacts
eth-clean:
    cd contracts && forge clean

# Format Solidity files
eth-fmt:
    cd contracts && forge fmt

# Start frontend dev server (Next.js)
# Optionally pass a contract address to update the local chain config
# Usage: just watch-frontend-dev [address]
watch-frontend-dev address="":
    #!/usr/bin/env bash
    set -e

    if [ -n "{{address}}" ]; then
        node scripts/update-chain-config.js 31337 "{{address}}"
    fi

    cd apps/web && pnpm dev

# Generate wagmi TypeScript bindings from Solidity contracts
generate-bindings:
    cd apps/web && pnpm generate

# Build contracts and regenerate TypeScript bindings
eth-build-all: eth-build generate-bindings

# Build Chrome extension (production)
ext-build:
    #!/usr/bin/env bash
    set -e
    cd apps/extension
    pnpm build

    # Copy to bin directory for easy import
    mkdir -p ../../bin
    rm -rf ../../bin/chrome-extension
    cp -r build/chrome-mv3-prod ../../bin/chrome-extension

    echo ""
    echo "============================================"
    echo "Chrome extension built successfully!"
    echo "Load in Chrome: chrome://extensions"
    echo "  1. Enable Developer mode"
    echo "  2. Click 'Load unpacked'"
    echo "  3. Select: bin/chrome-extension"
    echo "============================================"

# Build Chrome extension (development with hot reload)
ext-dev:
    cd apps/extension && pnpm dev
