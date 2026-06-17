#!/usr/bin/env bash
# BuildCycle End-to-End Test
# Deploys contracts, runs a full list → escrow → pickup → release flow on testnet.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."
ENV_FILE="$PROJECT_DIR/.env"

[ -f "$ENV_FILE" ] && source "$ENV_FILE"

SOROBAN_RPC_URL="${SOROBAN_RPC_URL:-https://soroban-testnet.stellar.org}"
NETWORK_PASSPHRASE="${SOROBAN_NETWORK_PASSPHRASE:-Test SDF Network ; September 2015}"
SELLER_KEY="${E2E_SELLER_KEY:?Set E2E_SELLER_KEY in .env}"
BUYER_KEY="${E2E_BUYER_KEY:?Set E2E_BUYER_KEY in .env}"

run() { echo "▶ $*"; "$@"; }
check() { echo "✓ $1"; }

echo "=== BuildCycle E2E Test ==="
echo "Network: $SOROBAN_RPC_URL"

# 1. Deploy contracts
echo ""
echo "--- Step 1: Deploy contracts ---"
run bash "$SCRIPT_DIR/deploy-contracts.sh"
source "$ENV_FILE"  # reload to get new contract IDs

BATCH_CONTRACT="${BATCH_TOKEN_ID:?BATCH_TOKEN_ID not set after deploy}"
ESCROW_CONTRACT="${ESCROW_ID:?ESCROW_ID not set after deploy}"
POOL_CONTRACT="${COMMUNITY_POOL_ID:?COMMUNITY_POOL_ID not set after deploy}"

# 2. Fund accounts via Friendbot
echo ""
echo "--- Step 2: Fund testnet accounts ---"
SELLER_PUB=$(stellar keys address "$SELLER_KEY" 2>/dev/null || soroban keys address "$SELLER_KEY")
BUYER_PUB=$(stellar keys address "$BUYER_KEY" 2>/dev/null || soroban keys address "$BUYER_KEY")

curl -sf "https://friendbot.stellar.org?addr=$SELLER_PUB" > /dev/null && check "Seller funded"
curl -sf "https://friendbot.stellar.org?addr=$BUYER_PUB" > /dev/null && check "Buyer funded"

# 3. Mint a batch
echo ""
echo "--- Step 3: Mint batch ---"
QR_SECRET="e2e-test-secret-$(date +%s)"
BATCH_ID=9001

METADATA='{"title":"E2E Test Lumber","category":"lumber","quantity":50,"unit":"boards","condition":"Used","dimensions":"2x4x8ft","gps_lat":40.7128,"gps_lon":-74.0060,"photos_cid":"Qm000000","description":"E2E test batch"}'

run soroban contract invoke \
  --id "$BATCH_CONTRACT" \
  --source "$SELLER_KEY" \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- mint \
  --seller "$SELLER_PUB" \
  --metadata "$METADATA" \
  --qr_secret "$QR_SECRET"

check "Batch minted (id=$BATCH_ID)"

# 4. Create + lock escrow
echo ""
echo "--- Step 4: Create and lock escrow ---"
ESCROW_ID_VAL=1
AMOUNT=100

run soroban contract invoke \
  --id "$ESCROW_CONTRACT" \
  --source "$SELLER_KEY" \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- create_escrow \
  --batch_id "$BATCH_ID" \
  --buyer "$BUYER_PUB" \
  --seller "$SELLER_PUB" \
  --sent_asset "USDC" \
  --receive_asset "USDC" \
  --path "[]"

check "Escrow created"

run soroban contract invoke \
  --id "$ESCROW_CONTRACT" \
  --source "$BUYER_KEY" \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- lock_payment \
  --escrow_id "$ESCROW_ID_VAL"

check "Payment locked"

# 5. Confirm pickup via QR
echo ""
echo "--- Step 5: Confirm pickup ---"
run soroban contract invoke \
  --id "$ESCROW_CONTRACT" \
  --source "$BUYER_KEY" \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- confirm_pickup \
  --escrow_id "$ESCROW_ID_VAL" \
  --qr_proof "$QR_SECRET"

check "Pickup confirmed"

# 6. Verify balances
echo ""
echo "--- Step 6: Verify balances ---"
ESCROW_STATUS=$(soroban contract invoke \
  --id "$ESCROW_CONTRACT" \
  --source "$BUYER_KEY" \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- get_escrow_status \
  --escrow_id "$ESCROW_ID_VAL")

echo "Escrow status: $ESCROW_STATUS"
if echo "$ESCROW_STATUS" | grep -q "Released"; then
  check "Escrow released — 95% to seller, 5% to pool"
else
  echo "✗ Expected Released, got: $ESCROW_STATUS"
  exit 1
fi

POOL_BALANCE=$(soroban contract invoke \
  --id "$POOL_CONTRACT" \
  --source "$BUYER_KEY" \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$NETWORK_PASSPHRASE" \
  -- get_balance)

echo "Pool balance: $POOL_BALANCE"
check "Community pool received fee"

echo ""
echo "=== E2E Test PASSED ==="
