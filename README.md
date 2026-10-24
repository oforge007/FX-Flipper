# FX Flipper

A safety-first Celo + MiniPay agent rails prototype for a dry-run FX trading bot with bounded automation, GitHub-backed ledgering, and explicit human-in-the-loop controls.

## Overview

This repo follows the plan in `PLAN.md` and begins with Milestone 0: repository skeleton, TypeScript foundation, config scaffolding, deterministic execution stubs, and safety-first defaults.

## Principles

- Minimal dependencies: TypeScript + viem + zod.
- Default to dry-run and paper trading.
- No secrets committed to the repo.
- All on-chain facts must be verified and recorded in `config/addresses.json` with source URLs.
- GitHub is the append-only ledger store.
- Human controls remain authoritative; the bot is an assistant, not a custodian.

## Quick start

1. Install dependencies:
   npm install
2. Copy the example environment:
   cp .env.example .env
3. Edit config values, especially:
   - `config/limits.json`
   - `config/sources.json`
   - `config/addresses.json`
4. Run dry-run checks:
   npm run build
   npm test

## Repo structure

- `config/` — source lists, limits, addresses, and prompts
- `schemas/` — JSON schema or validator definitions
- `src/` — TypeScript source
- `src/exec/` — deterministic execution core
- `src/roles/` — role placeholders A–N
- `ledger/` — append-only JSONL accounting
- `runs/` — per-cycle artifacts
- `reports/` — K/L/N reports
- `public/` — agent card metadata
- `.github/workflows/` — GitHub Actions automation

## Important

This is not financial advice, and it is not a guarantee of profit. The repo is designed as a safety-focused agent architecture demo for Celo and MiniPay workflows.
