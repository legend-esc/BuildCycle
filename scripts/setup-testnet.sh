#!/usr/bin/env bash
set -euo pipefail

echo "=== BuildCycle Testnet Setup ==="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."
ENV_FILE="$PROJECT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found. Run deploy-contracts.sh first."
  exit 1
fi

source "$ENV_FILE"

SOROBAN_RPC_URL="${SOROBAN_RPC_URL:-https://soroban-testnet.stellar.org}"
SOROBAN_NETWORK_PASSPHRASE="${SOROBAN_NETWORK_PASSPHRASE:-Test SDF Network ; September 2015}"
SOROBAN_ACCOUNT="${SOROBAN_ACCOUNT:-}"
FRIENDBOT_URL="${FRIENDBOT_URL:-https://friendbot.stellar.org}"

if [ -z "$SOROBAN_ACCOUNT" ]; then
  echo "Funding new account via Friendbot..."
  curl -s "$FRIENDBOT_URL?addr=$SOROBAN_ACCOUNT" > /dev/null
  echo "Account funded: $SOROBAN_ACCOUNT"
fi

echo ""
echo "Initializing BatchToken contract..."
soroban contract invoke \
  --id "$BATCH_TOKEN_ID" \
  --source "$SOROBAN_ACCOUNT" \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" \
  -- \
  initialize \
  --admin "$SOROBAN_ACCOUNT"

echo "Initializing CommunityPool contract..."
soroban contract invoke \
  --id "$COMMUNITY_POOL_ID" \
  --source "$SOROBAN_ACCOUNT" \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" \
  -- \
  initialize \
  --admin "$SOROBAN_ACCOUNT"

echo "Initializing Escrow contract..."
soroban contract invoke \
  --id "$ESCROW_ID" \
  --source "$SOROBAN_ACCOUNT" \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" \
  -- \
  initialize \
  --admin "$SOROBAN_ACCOUNT" \
  --batch_token "$BATCH_TOKEN_ID" \
  --community_pool "$COMMUNITY_POOL_ID" \
  --fee_bps 500

echo ""
echo "=== Testnet Setup Complete ==="
echo "All contracts initialized and ready."
echo "RPC:  $SOROBAN_RPC_URL"
echo "Account: $SOROBAN_ACCOUNT"
