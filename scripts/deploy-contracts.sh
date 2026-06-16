#!/usr/bin/env bash
set -euo pipefail

echo "=== BuildCycle Contract Deployment ==="

NETWORK="${1:-testnet}"
echo "Deploying to: $NETWORK"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."
CONTRACTS_DIR="$PROJECT_DIR/contracts"
ENV_FILE="$PROJECT_DIR/.env"

# Load environment
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
fi

SOROBAN_RPC_URL="${SOROBAN_RPC_URL:-https://soroban-testnet.stellar.org}"
SOROBAN_NETWORK_PASSPHRASE="${SOROBAN_NETWORK_PASSPHRASE:-Test SDF Network ; September 2015}"
SOROBAN_ACCOUNT="${SOROBAN_ACCOUNT:-}"

if [ -z "$SOROBAN_ACCOUNT" ]; then
  echo "Error: SOROBAN_ACCOUNT not set. Create an account first or set it in .env"
  exit 1
fi

echo "Building contracts..."
cd "$CONTRACTS_DIR"
cargo build --target wasm32-unknown-unknown --release 2>&1

echo "Deploying BatchToken..."
BATCH_TOKEN_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/buildcycle_batch_token.wasm \
  --source "$SOROBAN_ACCOUNT" \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE")
echo "BatchToken deployed at: $BATCH_TOKEN_ID"

echo "Deploying CommunityPool..."
COMMUNITY_POOL_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/buildcycle_community_pool.wasm \
  --source "$SOROBAN_ACCOUNT" \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE")
echo "CommunityPool deployed at: $COMMUNITY_POOL_ID"

echo "Deploying Escrow..."
ESCROW_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/buildcycle_escrow.wasm \
  --source "$SOROBAN_ACCOUNT" \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE")
echo "Escrow deployed at: $ESCROW_ID"

# Save to .env
if grep -q "^BATCH_TOKEN_ID=" "$ENV_FILE" 2>/dev/null; then
  sed -i "s/^BATCH_TOKEN_ID=.*/BATCH_TOKEN_ID=$BATCH_TOKEN_ID/" "$ENV_FILE"
else
  echo "BATCH_TOKEN_ID=$BATCH_TOKEN_ID" >> "$ENV_FILE"
fi

if grep -q "^COMMUNITY_POOL_ID=" "$ENV_FILE" 2>/dev/null; then
  sed -i "s/^COMMUNITY_POOL_ID=.*/COMMUNITY_POOL_ID=$COMMUNITY_POOL_ID/" "$ENV_FILE"
else
  echo "COMMUNITY_POOL_ID=$COMMUNITY_POOL_ID" >> "$ENV_FILE"
fi

if grep -q "^ESCROW_ID=" "$ENV_FILE" 2>/dev/null; then
  sed -i "s/^ESCROW_ID=.*/ESCROW_ID=$ESCROW_ID/" "$ENV_FILE"
else
  echo "ESCROW_ID=$ESCROW_ID" >> "$ENV_FILE"
fi

echo ""
echo "=== Deployment Complete ==="
echo "BatchToken:     $BATCH_TOKEN_ID"
echo "CommunityPool:  $COMMUNITY_POOL_ID"
echo "Escrow:         $ESCROW_ID"
echo "Contract IDs saved to $ENV_FILE"
