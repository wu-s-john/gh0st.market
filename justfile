# JobRegistry Development Commands
# Usage: just <command>

# Load environment variables from .env.local
set dotenv-load
set dotenv-filename := ".env.local"

# Default anvil test account
export PRIVATE_KEY := "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
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
        --private-key {{PRIVATE_KEY}} \
        --broadcast

    echo ""
    echo "============================================"
    echo "Local dev environment ready!"
    echo "Anvil PID: $ANVIL_PID"
    echo "RPC URL: {{RPC_URL}}"
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
    cd contracts && forge script script/DeployJobRegistry.s.sol \
        --rpc-url {{RPC_URL}} \
        --private-key {{PRIVATE_KEY}} \
        --broadcast

# Deploy to Sepolia (requires SEPOLIA_RPC_URL and DEPLOYER_KEY env vars)
eth-deploy-sepolia:
    cd contracts && forge script script/DeployJobRegistry.s.sol \
        --rpc-url $SEPOLIA_RPC_URL \
        --private-key $DEPLOYER_KEY \
        --broadcast

# Clean build artifacts
eth-clean:
    cd contracts && forge clean

# Format Solidity files
eth-fmt:
    cd contracts && forge fmt

# Start frontend dev server (Next.js)
watch-frontend-dev:
    cd apps/web && pnpm dev

# Generate wagmi TypeScript bindings from Solidity contracts
generate-bindings:
    cd apps/web && pnpm generate

# Build contracts and regenerate TypeScript bindings
eth-build-all: eth-build generate-bindings
