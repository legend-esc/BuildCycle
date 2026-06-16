# Contributing to BuildCycle

## Quick Start

```bash
git clone https://github.com/your-org/buildcycle.git
cd buildcycle
cp .env.example .env
docker-compose up -d
```

The app will be available at `http://localhost:3000`.

## Project Structure

```
contracts/          # Soroban smart contracts (Rust)
  batch-token/      # Batch NFT token contract
  escrow/           # Escrow payment contract
  community-pool/   # Community fund contract
backend/            # Express API server (TypeScript)
  src/
    routes/         # API route handlers
    middleware/     # Auth middleware
    services/      # IPFS, external services
    types/         # Database types
  indexer/         # Rust event indexer
frontend/          # Next.js app (TypeScript, Tailwind)
  src/
    pages/         # Route pages
    components/    # Reusable components
    hooks/         # React Query hooks
    stores/        # Zustand stores
    utils/         # Helpers (mock data, contract helpers)
scripts/           # Deployment and utility scripts
```

## Development

### Smart Contracts

```bash
cd contracts
cargo test          # Run contract tests
cargo build --target wasm32-unknown-unknown --release  # Build WASM
```

### Backend

```bash
cd backend
npm install
npm run dev         # Start dev server on :3001
npm run build       # Compile TypeScript
```

### Frontend

```bash
cd frontend
npm install
npm run dev         # Start dev server on :3000
npm run build       # Production build
npm run lint        # Lint check
```

## Testnet Deployment

```bash
# 1. Fund an account
./scripts/setup-testnet.sh

# 2. Deploy contracts
./scripts/deploy-contracts.sh testnet

# 3. Seed database
npx ts-node scripts/seed-database.ts
```

## Coding Conventions

- **Rust:** Follow `rustfmt`, use `#![no_std]` for contracts, handle errors with custom error enums
- **TypeScript:** Use strict types, avoid `any`, prefer interfaces over types for objects
- **React:** Use functional components with hooks, React Query for server state, Zustand for client state
- **Tailwind:** Use the project's custom `buildcycle-gray` and `buildcycle-orange` color palette
- **No comments in code** unless explaining non-obvious logic

## Pull Request Process

1. Create a branch from `main` with a descriptive name
2. Ensure all tests pass (`cargo test`, `npm run lint`, `npm run build`)
3. Update docs if adding new features
4. Open a PR against `main` with a clear description of changes

## Commit Messages

Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`

## Need Help?

Open an issue on GitHub or reach out to the team.
