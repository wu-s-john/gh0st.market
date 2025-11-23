#!/usr/bin/env node
/**
 * Update chain config with new contract address
 * Usage: node scripts/update-chain-config.js <chainId> <address> [deploymentBlock]
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../apps/web/src/lib/contracts.config.ts');

const [, , chainId, address, deploymentBlock] = process.argv;

if (!chainId || !address) {
  console.error('Usage: node scripts/update-chain-config.js <chainId> <address> [deploymentBlock]');
  process.exit(1);
}

// Validate address format
if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
  console.error('Invalid address format. Must be 0x followed by 40 hex characters.');
  process.exit(1);
}

// Read current config
let content = fs.readFileSync(CONFIG_PATH, 'utf8');

// Build the replacement for the chain block
const blockValue = deploymentBlock || '0';
const chainIdNum = parseInt(chainId, 10);

// Create regex to match the chain block
const chainBlockRegex = new RegExp(
  `(${chainIdNum}:\\s*\\{[^}]*jobRegistryAddress:\\s*")0x[a-fA-F0-9]*(")`,
  's'
);

if (chainBlockRegex.test(content)) {
  // Update existing entry
  content = content.replace(chainBlockRegex, `$1${address}$2`);

  // Also update deployment block if provided
  if (deploymentBlock) {
    const blockRegex = new RegExp(
      `(${chainIdNum}:\\s*\\{[^}]*deploymentBlock:\\s*)BigInt\\(\\d+\\)`,
      's'
    );
    content = content.replace(blockRegex, `$1BigInt(${blockValue})`);
  }

  fs.writeFileSync(CONFIG_PATH, content);
  console.log(`Updated chain ${chainId} config:`);
  console.log(`  Address: ${address}`);
  if (deploymentBlock) {
    console.log(`  Block: ${deploymentBlock}`);
  }
} else {
  console.error(`Chain ${chainId} not found in config. Add it manually first.`);
  process.exit(1);
}
