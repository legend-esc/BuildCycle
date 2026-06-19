# Contributing to BuildCycle

## Quick Start

```bash
git clone https://github.com/your-org/buildcycle.git
cd buildcycle
cp .env.example .env
docker-compose up -d
```

The app will be available at `http://localhost:3000`.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Security Vulnerabilities](#security-vulnerabilities)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [Coding Conventions](#coding-conventions)
- [Pull Request Process](#pull-request-process)
- [Commit Messages](#commit-messages)
- [Need Help?](#need-help)

---

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold it.

## Reporting Bugs

Open a [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) — include a clear description, steps to reproduce, environment details, and screenshots if applicable.

## Requesting Features

Open a [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) — describe the problem you're solving, your proposed solution, and which part of the project it affects.

## Security Vulnerabilities

Please **do not** file public issues for security vulnerabilities. See [SECURITY.md](SECURITY.md) for our disclosure process.

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

1. Create a branch from `main` with a descriptive name (e.g. `feat/my-feature`, `fix/bug-description`)
2. Make your changes, following the [coding conventions](#coding-conventions)
3. Ensure all tests pass:
   ```bash
   cd contracts && cargo test
   cd ../frontend && npm run lint && npm run build
   cd ../backend && npx tsc --noEmit && npm run build
   ```
4. Update docs if adding new features
5. Open a PR against `main` using the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md). Include:
   - What the change does and why
   - Which issue it closes (if applicable)
   - How it was tested
   - Screenshots for UI changes

## Commit Messages

Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`

## Need Help?

Open an issue on GitHub or reach out to the team.
