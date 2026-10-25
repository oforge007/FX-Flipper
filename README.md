# FX Flipper

A safety-first MiniPay + Celo agent rails prototype designed for dry-run automation, auditable execution, and human-controlled policy gates.

## Overview

This repo is an agent-architecture prototype for a Celo-based autonomous FX trading loop. It keeps the economic path narrow and deterministic:

- LLM roles analyze and approve context
- code roles handle price checks, execution conditions, and ledger policy
- all live execution remains behind explicit dry-run and kill-switch checks
- wallet material never enters the LLM layer

## Current repo status

- Milestone M0: project skeleton created
- Milestone M1: deterministic dry-run execution core added
- Milestone M1-AA: Account Abstraction intent policy scaffolding added and kept dry-run-only
- Live mainnet addresses remain intentionally unverified and are not used yet

## Safety-first design

- `G -> H -> I` stay deterministic and code-controlled
- `limits.json` and `aa.json` are policy-first guardrails
- session-key intent checks are scaffolded, but no live signing or mainnet execution is active
- GitHub-backed append-only ledger is used for traceability
- the repo defaults to `DRY_RUN=true` and `LIVE_MODE=false`

## Quick start

```bash
npm install
cp .env.example .env
npm run build
npm test
npm run ui
```

Then open:
- `http://localhost:8000/` for the local frontend dashboard
- or open `index.html` directly in a browser

## Frontend preview

The repo includes a lightweight static dashboard at the root `index.html`.

- Local preview:
  ```bash
  python3 -m http.server 8000
  ```
  Then browse to `http://localhost:8000/`

- GitHub Pages / Vercel:
  - this repo is compatible with a static host once enabled
  - set the static app root to the repo root or a public folder

## Architecture

```text
A/B/C/D/E/F → analysis + approvals
      ↓
G (price feed) → H (condition evaluator) → I (executor)
                                 ↓
                              J (ledger)
```

## Next implementation plan

### M2 — analysis chain (A–F)

- add mock LLM adapter and signal contracts
- create `runs/<id>/<role>.json` output artifacts
- add signal-to-order pipeline stubs
- add approval validation and order schema enforcement

### M3 — session-key execution model

- define exact Celo AA intent payloads
- validate router/token allowlists, amount caps, deadline, and slippage
- model the session-key permission layer and dry-run `userOp` assembly
- keep wallet secrets external to the repo and never log them

### M4 — Celo + MiniPay verification layer

- verify official Celo contract addresses via Celopedia / docs
- populate `config/addresses.json` with source URLs
- confirm router support and pair validity before any live trade
- add x402 client/server stub as an optional paid endpoint

### M5 — live micro-trade gate

- explicit `LIVE_MODE=true` commit only
- dedicated hot wallet or smart-account session key with strict caps
- block explorer verification and ledger append on each trade

### M6 — polish and demo

- final README cleanup
- demo script and honest risk disclaimer
- fork-and-run instructions for other users

## Important constraints

- No heavy frameworks, no Docker, no broad dependency tree.
- All wallet material stays outside the LLM
- Secret scanning should be added before live benig used
- No live mainnet actions until `config/addresses.json` is verified and `LIVE_MODE` is explicitly enabled

## Not financial advice

This repo is a safety-demo and architecture prototype. It is not a guarantee of profit and should not be treated as financial advice.
