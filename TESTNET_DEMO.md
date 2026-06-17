# BuildCycle — Testnet Demo Walkthrough

Run the full purchase flow on Stellar testnet in under 10 minutes.

## Prerequisites

- Docker and Docker Compose installed
- [Freighter browser extension](https://freighter.app) set to **Testnet** mode
- Rust + `wasm32-unknown-unknown` target (`rustup target add wasm32-unknown-unknown`)
- Soroban CLI (`cargo install --locked stellar-cli --features opt`)
- Node.js 20+

---

## 1. Clone & configure (2 min)

```bash
git clone https://github.com/your-org/buildcycle.git
cd buildcycle
cp .env.example .env
```

Open `.env` and set:

```env
SOROBAN_ACCOUNT=<your-testnet-secret-key>   # S... key from Freighter (testnet)
E2E_SELLER_KEY=<seller-secret-key>
E2E_BUYER_KEY=<buyer-secret-key>
```

> **Tip:** Create two testnet accounts in Freighter (Settings → Network → Testnet), export both secret keys.

---

## 2. Start services (1 min)

```bash
docker-compose up -d
```

This starts PostgreSQL with PostGIS and the backend API. Wait ~10 seconds for Postgres to be ready.

Verify:

```bash
docker-compose ps   # postgres and backend should show "Up"
```

---

## 3. Deploy contracts to testnet (3 min)

```bash
# Fund your account via Friendbot
bash scripts/setup-testnet.sh

# Build and deploy all three contracts
bash scripts/deploy-contracts.sh
```

Contract IDs are written back to `.env` automatically.

---

## 4. Seed the database (30 sec)

```bash
cd backend && npx ts-node ../scripts/seed-database.ts
```

This inserts 20 realistic batch listings with GPS coordinates.

---

## 5. Start the frontend (30 sec)

```bash
cd frontend && npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 6. Run the full purchase flow (3 min)

### As Seller

1. Connect Freighter wallet (top-right button) — use the seller account.
2. Go to **Sell** → fill out the form (any test data, drag a photo, pin a location).
3. Complete all steps → click **Sign & List**.
4. Your batch appears on the **Map** and **Browse** pages.

### As Buyer

5. Switch Freighter to the buyer account.
6. Browse to **Browse** or **Map**, click a listing.
7. On the **BatchDetail** page, click **Purchase**.
8. Approve both transactions in Freighter (create escrow + lock payment).
9. Status badge shows **LOCKED**.

### Pickup verification

10. Go to **Scan** (`/scan`).
11. The QR code was shown at the end of the sell flow — scan it (or paste the `batchId:secret` string manually in dev mode).
12. Approve the `confirm_pickup` transaction.
13. Status updates to **RELEASED**.
14. Check **Dashboard** — seller wallet received 95%, community pool received 5%.

---

## 7. Verify on Stellar Explorer

All transactions are public. Paste any contract ID into:

```
https://stellar.expert/explorer/testnet/contract/<CONTRACT_ID>
```

---

## Automated E2E

Skip the manual steps above and run:

```bash
bash scripts/e2e-test.sh
```

This deploys, funds, mints, escrows, confirms pickup, and verifies balances — all scripted.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Friendbot rate limit | Wait 30s and retry, or use a fresh testnet account |
| `SOROBAN_ACCOUNT not set` | Check `.env` has the secret key (starts with `S`) |
| Frontend shows blank map | Leaflet requires `ssr: false` — already applied; clear `.next/` cache if needed |
| Escrow stuck in LOCKED | Dispute deadline hasn't passed; call `auto_release` after 48h or raise a dispute |
