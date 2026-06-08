# BuildCycle

> A decentralized marketplace on **Stellar** for salvaged and overstock construction materials — connecting contractors, landlords, and DIY builders while funding community tool libraries and trade training.

---

## Table of Contents

- [Problem](#problem)
- [Vision](#vision)
- [How It Works](#how-it-works)
- [Architecture Overview](#architecture-overview)
- [Smart Contracts (Soroban)](#smart-contracts-soroban)
  - [BatchToken Contract](#1-batchtoken-contract)
  - [Escrow Contract](#2-escrow-contract)
  - [PathPay SWAPPER](#3-pathpay-integration-layer)
- [User Flows](#user-flows)
  - [Seller Flow](#seller-flow)
  - [Buyer Flow](#buyer-flow)
  - [Community Fund Flow](#community-fund-flow)
- [Frontend](#frontend)
- [API / Backend Services](#api--backend-services)
- [Fee Structure & Tokenomics](#fee-structure--tokenomics)
- [Security & Trust](#security--trust)
- [Local Development](#local-development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Problem

Construction projects consistently generate vast amounts of **salvageable material**:

| Source              | Typical Waste                        |
|---------------------|--------------------------------------|
| Renovations         | Usable cabinets, fixtures, lumber    |
| New construction    | Overstock tile, wire spools, pipe    |
| Demolition          | Reclaimed brick, timber, fixtures    |
| Landlord turnovers  | Light fixtures, flooring, vanities   |

**Current landscape:**
- Landfills receive millions of tons of reusable construction debris annually.
- Contractors have no efficient local channel to offload overstock.
- DIY renovators, small builders, and nonprofits overpay for new materials.
- Community tool libraries and trade training programs are chronically underfunded.

> **The gap:** No trusted, low-friction local marketplace exists for bulk building materials with built-in escrow and community reinvestment.

---

## Vision

**BuildCycle** is that marketplace — built on the **Stellar network** for fast, cheap, cross-currency settlement.

> *"Every board pulled from a dumpster becomes a roof over someone's head; every overstock tile funds a apprenticeship."*

### Core pillars

1. **Tokenized Batches** — Each material lot is an on-chain asset (quantity, condition, photos, GPS).
2. **Escrow with QR Verification** — Buyer funds are locked until physical pickup is confirmed via QR scan.
3. **Community Auto-Fee** — 5% of every transaction flows directly to a verified tool library or training fund.
4. **Stellar Path Payments** — Buyer pays in USDC; seller receives EURC (or any preferred asset) automatically.

---

## How It Works

```
  Seller lists batch ──> Batch token minted ──> Listed on marketplace
                                                      │
  Buyer finds listing ──> Pays into Escrow (multi‑asset via path payment)
                                                      │
  Buyer picks up materials ──> Scans QR on pallet ──> Escrow releases
                                                      │
                          ┌────────────────────────────┼──────────────┐
                          ▼                            ▼              ▼
                    Seller (95%)            5% to Community      Buyer gets
                                            Tool Library /       proof of
                                            Training Fund        release NFT
```

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/Next.js)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │ Listings │  │  Detail  │  │  Wallet  │  │  Dashboard /    │  │
│  │  /Browse │  │  + Map   │  │ Connect  │  │  My Batches     │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────────┘  │
└──────────────────────┬───────────────────────────────────────────┘
                       │ Stellar SDK + Wallet (Freighter / xBull)
┌──────────────────────▼───────────────────────────────────────────┐
│                   BACKEND / INDEXER SERVICES                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │ Metadata API │  │  Event       │  │  IPFS / Arweave      │    │
│  │ (off-chain)  │  │  Indexer     │  │  (photos, docs)      │    │
│  └──────────────┘  └──────────────┘  └──────────────────────┘    │
└──────────────────────┬───────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│               STELLAR NETWORK (Soroban Smart Contracts)           │
│                                                                   │
│  ┌─────────────────────┐   ┌──────────────────────────┐          │
│  │  BatchToken Contract│   │  Escrow Contract          │          │
│  │  ─────────────────  │   │  ───────────────────────  │          │
│  │  .mint()            │   │  .createEscrow()          │          │
│  │  .transfer()        │   │  .lockPayment()           │          │
│  │  .burn()            │   │  .confirmPickup()         │          │
│  │  .updateMetadata()  │   │  .releaseFunds()          │          │
│  │  .reportCondition() │   │  .dispute()               │          │
│  └─────────────────────┘   └──────────────────────────┘          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────┐          │
│  │  Path Payment Integration (native Stellar)          │          │
│  │  ─────────────────────────────────────────────────  │          │
│  │  path_payment_strict_send / path_payment_strict_receive       │
│  └─────────────────────────────────────────────────────┘          │
│                                                                   │
│  ┌─────────────────────┐                                          │
│  │  CommunityPool      │                                          │
│  │  Contract           │                                          │
│  │  ────────────────   │                                          │
│  │  .distribute()      │                                          │
│  │  .proposeRecipient()│                                          │
│  │  .voteRecipient()   │                                          │
│  └─────────────────────┘                                          │
└───────────────────────────────────────────────────────────────────┘
```

---

## Smart Contracts (Soroban)

All smart contracts are written in **Rust** using the **Soroban SDK** and deployed on **Stellar**.

### 1. BatchToken Contract

The core asset contract. Each material batch is a **non-fungible token (NFT)** carrying rich metadata.

#### Storage entries

```
Key                          Value
─────────────────────────────────────────────────────
Batch(batch_id)             Batch { seller, metadata_hash, qr_secret_hash, active }
BatchMetadata(batch_id)     Metadata { title, category, quantity, unit, condition, dimensions, gps_lat, gps_lon, photos_cid, description }
BatchCondition(batch_id)    Vec<ConditionReport> { reporter, timestamp, notes, grade }
BuyerClaim(batch_id)        Option<Address>         // buyer once escrow is locked
```

#### Functions

| Function | Parameters | Description |
|---|---|---|
| `mint` | `seller, metadata, qr_secret` | Mint a new batch token. Emits `BatchListed` event. |
| `update_metadata` | `batch_id, metadata` | Seller updates description, photos, price. |
| `report_condition` | `batch_id, grade, notes` | Buyer or third party submits condition report on pickup. |
| `set_buyer` | `batch_id, buyer` | Escrow contract calls this when payment locked. |
| `burn` | `batch_id` | Seller removes listing (only if no active escrow). |
| `is_verified_pickup` | `batch_id, qr_proof` | Checks QR secret hash to confirm physical pickup. |
| `batch_uri` | `batch_id` | Returns off-chain metadata URI (IPFS/Arweave). |
| `batches_by_seller` | `seller` | Paginated list of a seller's batches. |
| `active_batches` | `(lat, lon, radius)` | Geo-filtered active listings. |

#### Events

- `BatchListed(batch_id, seller, category, timestamp)`
- `BatchConditionReported(batch_id, reporter, grade)`
- `BatchClaimed(batch_id, buyer)`
- `BatchClosed(batch_id)`

---

### 2. Escrow Contract

Manages payment locking, QR-verified release, and the 95/5 split.

#### Storage entries

```
Key                          Value
─────────────────────────────────────────────────────
Escrow(escrow_id)           Escrow { batch_id, buyer, seller, amount_sent, amount_path, sent_asset, received_asset, path, status, dispute_deadline }
CommunityConfig             { fee_bps: 500, pool_address, min_fee, max_fee }
Dispute(escrow_id)          Dispute { raised_by, reason, resolved, resolution }
```

#### States

```
CREATED → LOCKED → RELEASED (or DISPUTED → RESOLVED)
```

#### Functions

| Function | Parameters | Description |
|---|---|---|
| `create_escrow` | `batch_id, buyer, seller, sent_asset, receive_asset, path` | Initiate escrow with path payment specification. |
| `lock_payment` | `escrow_id` | Buyer sends payment to escrow contract. Uses `path_payment_strict_send` if path provided. |
| `confirm_pickup` | `escrow_id, qr_proof` | Buyer or seller submits QR secret. Contract validates against stored hash. |
| `auto_release` | `escrow_id` | Anyone can call after `dispute_deadline` if no dispute raised. |
| `release_funds` | `escrow_id` | Splits 95% to seller, 5% to community pool. Transfers batch token to buyer. |
| `dispute` | `escrow_id, reason` | Buyer or seller raises dispute within window. |
| `resolve_dispute` | `escrow_id, resolution, admin` | Admin resolves: full refund to buyer or full release to seller. |
| `get_escrow_status` | `escrow_id` | Returns current status and relevant addresses. |
| `update_community_config` | `new_pool, new_bps` | Owner updates fee parameters. |
| `claim_unclaimed` | `batch_id` | If escrow not created after X time, seller can reclaim listing. |

#### Fee calculation

```rust
fn calculate_split(amount: i128, bps: u32) -> (i128, i128) {
    let fee = amount * bps as i128 / 10_000;   // e.g. 500 bps = 5%
    let seller_share = amount - fee;
    (seller_share, fee)
}
```

---

### 3. PathPay Integration Layer

Rather than a custom contract, BuildCycle **leverages Stellar's native path payment operations**:

- `path_payment_strict_send` — Buyer specifies exact amount to debit; seller receives variable (with slippage tolerance).
- `path_payment_strict_receive` — Buyer specifies exact amount seller should receive; buyer pays variable.

**Supported asset pairs** (via Stellar decentralized exchange paths):

| Buyers Pay (any) | Sellers Receive (preferred) |
|---|---|
| USDC | USDC |
| EURC | EURC |
| BRL | USDC / EURC |
| XLM | XLM |
| Native asset (custom) | Any of the above |

> **Why this matters:** A contractor in Brazil can pay in BRL. A seller in Europe receives EURC. No manual conversion, no exchange fees — Stellar finds the cheapest path.

---

### CommunityPool Contract

Manages the community fund — distributing accumulated fees to verified tool libraries and training programs.

| Function | Parameters | Description |
|---|---|---|
| `propose_recipient` | `address, name, proof_doc_cid` | Submit a tool library or training org for funding. |
| `vote_recipient` | `proposal_id, approve` | Token-weighted or reputation-based vote. |
| `distribute` | `recipient_id, amount` | Send funds to approved recipient. |
| `get_balance` | — | View pool balance. |
| `get_distribution_history` | `recipient_id` | Audit trail of past distributions. |

---

## User Flows

### Seller Flow

```
1. Connect wallet (Freighter / xBull)
2. Tap "List New Batch"
3. Fill form:
   - Photos (upload → IPFS/Arweave)
   - Category (lumber / tile / electrical / plumbing / fixtures / hardware)
   - Quantity & unit
   - Condition (New / Like New / Used / Reclaimed)
   - Dimensions / weight
   - GPS pin on map
   - Preferred payout asset (USDC, EURC, XLM, BRL...)
   - Listing price in chosen asset
4. Set QR secret (auto-generated; printed onto weatherproof label)
5. Sign `mint()` transaction → batch token created
6. Affix QR label to pallet/crate
7. Listing appears on marketplace map
```

### Buyer Flow

```
1. Browse map or search by category / material / radius
2. Tap listing → see photos, condition reports, seller profile
3. "Purchase" → select payment asset (any Stellar anchor token)
4. Sign `create_escrow()` + `lock_payment()` transaction bundle
   - Escrow contract holds funds
   - Path payments convert automatically if buyer/seller assets differ
5. Receive pickup instructions + GPS location
6. Drive to location, inspect materials
7. Scan QR code on pallet with in-app scanner → signs `confirm_pickup()`
8. Funds released:
   - 95% → seller wallet
   - 5% → CommunityPool
9. Batch token transferred to buyer → serves as receipt / proof of origin
10. (Optional) Leave condition report
```

### Community Fund Flow

```
1. Escrow contract sends 5% to CommunityPool on each release
2. Pool aggregates funds
3. Tool libraries / training orgs submit proposals with proof documentation
4. Community votes on recipients (periodic rounds)
5. Funds distributed automatically via contract
6. All transactions visible on Stellar explorer
```

---

## Frontend

Built with **React (Next.js)** and the **@stellar/freighter-api** for wallet connectivity.

### Pages

| Route | Component | Description |
|---|---|---|
| `/` | `MapView` | Interactive map of active batches within viewport. |
| `/browse` | `ListingGrid` | Filterable card grid (category, price, condition, radius). |
| `/batches/[id]` | `BatchDetail` | Full listing, photos, condition reports, purchase button. |
| `/sell` | `SellForm` | Multi-step listing form with photo upload and GPS. |
| `/dashboard` | `UserDashboard` | My listings, my purchases, escrow statuses. |
| `/pool` | `PoolDashboard` | Community fund balance, proposals, voting. |
| `/scan` | `QRScanner` | Camera-based QR scanner for pickup verification. |
| `/disputes` | `DisputeCenter` | Open and resolved disputes. |

### Key components

- **WalletConnector** — Freighter / xBull / WalletConnect integration
- **MapPicker** — Leaflet/Mapbox with cluster markers for batch density
- **QRGenerator** — Generates QR encoding batch_id + secret; printable label
- **QRScanner** — Reads QR, constructs `confirm_pickup()` call
- **ConditionReportCard** — Star rating + notes + photo for condition
- **PathPaySelector** — Dropdown showing available payment routes and estimated outputs
- **IPFSUploader** — Drag-and-drop photo upload with IPFS pinning

### State management

- **React Query (TanStack Query)** for data fetching and cache
- **Zustand** for wallet connection state and UI preferences
- **Horizon/Event Stream** subscriptions for real-time escrow status updates

---

## API / Backend Services

| Service | Tech | Purpose |
|---|---|---|
| **Metadata API** | Node.js / Express | Off-chain batch metadata, user profiles, search indexing. |
| **IPFS Pinner** | Helia + Pinata | Pin listing photos and condition reports. |
| **Event Indexer** | Rust + Stellar Horizon | Listen for contract events, update database cache. |
| **Geo Indexer** | PostgreSQL + PostGIS | Spatial queries for map-based batch discovery. |
| **Push Notifications** | Firebase | Alert buyer on escrow status change, alert seller on pickup. |

---

## Fee Structure & Tokenomics

| Party | Share | Notes |
|---|---|---|
| **Seller** | 95% | Payout in their preferred asset via path payment. |
| **CommunityPool** | 5% | Non-custodial; contract-controlled. |
| **Platform** | 0% (eventually opt-in) | Zero platform fee at launch. Future: <1% on optional features (promoted listings, analytics). |

### Why zero platform fee?

BuildCycle is designed as a **public utility** for the construction industry. Revenue model (future):
- **Promoted listings** — Sellers pay 0.5% for boosted visibility.
- **Pro / Contractor verification** — Small fee for badge verification.
- **Enterprise APIs** — Bulk listing tools for large suppliers.

The **5% community fee is non-negotiable** — it is the core mechanism for reinvesting in the local building trades ecosystem.

---

## Security & Trust

### Escrow safety

- Funds are held by the **Escrow contract**, not a centralized party.
- No one — not even the platform — can unilaterally release funds without the correct QR proof OR a dispute resolution.
- Dispute deadline gives a safe window for inspecting materials (default: 48 hours after `lock_payment`).

### QR verification

- Each batch generates a **unique secret** hashed on-chain (`sha256(secret)`).
- The QR code encodes `batch_id || secret`.
- On scan, the contract recomputes `sha256(provided_secret)` and compares to stored hash.
- The plaintext secret is never stored on-chain — only the hash.
- Sellers print the QR label before listing; tampering with the label breaks the link.

### Dispute resolution

1. Buyer or seller raises `dispute()` within the dispute window.
2. Both parties submit evidence (photos, messages, third-party inspection).
3. Admin (DAO-governed in future) reviews and calls `resolve_dispute()`.
4. Resolution options:
   - **Full refund** — Buyer gets 100% back; seller gets nothing.
   - **Partial release** — X% to seller, Y% to buyer.
   - **Full release** — Seller gets 95%; fee still goes to community pool.

### Anti-fraud measures

- Seller reputation scores based on completed transactions and condition report averages.
- New sellers may have a lower maximum listing value until they complete 3+ transactions.
- Geolocation proximity checks — buyer and batch GPS must be within a reasonable radius for `confirm_pickup()`.

---

## Local Development

### Prerequisites

- Rust 1.75+ with `wasm32-unknown-unknown` target
- Soroban CLI (`cargo install soroban-cli`)
- Node.js 20+
- Stellar testnet account with friendbot-funded XLM
- Freighter browser extension (testnet mode)

### Clone & install

```bash
git clone https://github.com/your-org/buildcycle.git
cd buildcycle

# Smart contracts
cd contracts
cargo build

# Frontend
cd ../frontend
npm install

# Backend
cd ../backend
npm install
```

### Run tests

```bash
# Smart contract tests
cd contracts
cargo test

# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
npm run test
```

### Deploy contracts locally

```bash
# Start local Soroban devnet
soroban network start

# Navigate to contract
cd contracts/batch-token

# Deploy
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/buildcycle_batch_token.wasm \
  --source <SELLER_SECRET> \
  --network testnet

# Initialize
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source <SELLER_SECRET> \
  --network testnet \
  -- \
  mint \
  --seller <SELLER_PUBLIC> \
  --metadata <METADATA_JSON> \
  --qr_secret <SECRET>
```

### Environment variables

```env
# Frontend (.env.local)
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_BATCH_TOKEN_CONTRACT=CA...
NEXT_PUBLIC_ESCROW_CONTRACT=CB...
NEXT_PUBLIC_COMMUNITY_POOL_CONTRACT=CC...
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
NEXT_PUBLIC_MAPBOX_TOKEN=pk...

# Backend (.env)
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
BATCH_TOKEN_CONTRACT=CA...
ESCROW_CONTRACT=CB...
COMMUNITY_POOL_CONTRACT=CC...
DATABASE_URL=postgresql://localhost:5432/buildcycle
IPFS_PINATA_API_KEY=...
IPFS_PINATA_SECRET_KEY=...
```

---

## Testing

### Smart contract test coverage

```
✓ mint() — creates batch with correct metadata
✓ mint() — emits BatchListed event
✓ mint() — fails for non-seller
✓ create_escrow() — initializes with correct parties
✓ lock_payment() — holds funds in contract
✓ lock_payment() — path payment handles FX conversion
✓ confirm_pickup() — valid QR releases escrow
✓ confirm_pickup() — invalid QR rejected
✓ confirm_pickup() — cannot be called twice
✓ release_funds() — 95/5 split correct
✓ release_funds() — transfers batch token to buyer
✓ dispute() — within window succeeds
✓ dispute() — after deadline fails
✓ resolve_dispute() — admin can refund buyer
✓ community_fee() — accumulates in pool
✓ batch_uri() — returns valid IPFS URL
✓ geo_query() — returns batches within radius
```

### Integration tests

- End-to-end flow: list → escrow → scan → release → verify balances
- Multi-asset path payment with USDC/EURC/XLM
- Concurrent escrows on same batch (rejected)
- QR reuse prevention

---

## Deployment

### Testnet

1. Deploy contracts using Soroban CLI to Stellar testnet.
2. Configure frontend with testnet contract IDs.
3. Fund test accounts via Friendbot.
4. Verify full flow in `testnet` network.

### Mainnet

1. Audit smart contracts (see [Security](#security--trust)).
2. Deploy to Stellar mainnet with production admin keys.
3. Update frontend environment to `mainnet`.
4. Configure Horizon archive node for event indexing.
5. Launch with a pilot region (e.g., one metro area).

### Contract addresses (placeholder)

| Contract | Testnet | Mainnet |
|---|---|---|
| BatchToken | `CA...` | `CA...` |
| Escrow | `CB...` | `CB...` |
| CommunityPool | `CC...` | `CC...` |

---

## Roadmap

### Phase 1 — Core (Current)
- [x] Smart contract architecture design
- [ ] Soroban contract implementation (BatchToken, Escrow, CommunityPool)
- [ ] Contract unit tests
- [ ] React frontend with wallet connect
- [ ] QR generation and scanning
- [ ] Testnet deployment

### Phase 2 — Discovery & Geo
- [ ] Map-based batch browsing with PostGIS
- [ ] Advanced filtering (category, condition, price range, radius)
- [ ] Saved searches and alerts
- [ ] User reputation system with on-chain attestations

### Phase 3 — Community Pool
- [ ] Recipient proposal and voting UI
- [ ] Distribution automation
- [ ] Impact dashboard (tonnage diverted, funds distributed, tools lent)
- [ ] Partnerships with tool libraries and trade schools

### Phase 4 — Scale
- [ ] Mobile app (React Native with Stellar SDK)
- [ ] Bulk listing API for suppliers
- [ ] DAO governance for fee structure and dispute admin
- [ ] Integration with Stellar decentralized identity (DID / Stellar TSS)
- [ ] Cross-chain bridges (for non-Stellar stablecoins)

### Phase 5 — Ecosystem
- [ ] Carbon offset tracking (materials diverted from landfill = CO₂ saved)
- [ ] Insurance micro-products for high-value batches
- [ ] B2B procurement integrations with construction ERP systems

---

## Contributing

Contributions are welcome in all forms — code, documentation, design, or community organizing.

### Getting started

1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/amazing-feature`).
3. Commit changes (`git commit -m 'feat: add amazing feature'`).
4. Push to branch (`git push origin feat/amazing-feature`).
5. Open a Pull Request.

### Development guidelines

- Rust code: follow `rustfmt` and `clippy`.
- TypeScript/React: follow ESLint + Prettier configs.
- All new features must include tests.
- Smart contract changes require security review.

---

## License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

## Why Stellar?

| Feature | Stellar | Why it matters for BuildCycle |
|---|---|---|
| **Fee** | ~0.00001 XLM per op | Microtransactions viable; 5% fee doesn't get eaten by gas. |
| **Speed** | 3–5 second finality | Instant pickup confirmation; no waiting. |
| **Path Payments** | Native protocol op | Buyer pays in USDC → seller receives EURC; no DEX wrapping. |
| **Soroban** | Rust-based smart contracts | Familiar tooling; strong safety guarantees. |
| **Anchors** | Regulated fiat on/off ramp | Real-world adoption; non-crypto users can pay in digital dollars. |
| **Built-in DEX** | Order book + automated market | Path payments find optimal routes automatically. |
| **Sustainability** | Stellar Dev Foundation nonprofit | Aligns with community-oriented mission. |

---

> **BuildCycle** — *Turn waste into wages, trash into training, surplus into shelter.*
