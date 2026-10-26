# FX Flipper — project summary

## Goal
A shadow-first autonomous FX agent for the Celo cNGN/USDT corridor. It should enter only when the full expected round trip clears gas, quote economics, conservative execution haircuts, and a profit floor. The first version should prove that profitable opportunities exist before it submits real swaps.

## Current included scope
- Pure TypeScript round-trip economics calculations.
- Candidate eligibility checks and USDT gas-reserve sizing.
- Single-cycle state machine (buy -> open cNGN position -> sell -> closed).
- JSONL event ledger helper.
- Static UI with editable economics assumptions.
- Deterministic tests.
- Safe CLI example; no live signing or swap submission.

## Explicitly not implemented
- Live Textile FX API/RFQ adapter.
- Celo gas estimation against live swap calldata.
- Production database, distributed lock, job queue, and transaction reconciliation.
- ERC-4337 smart-account deployment, session-key setup, or bundler integration.
- Live manual/agent execution.
- Verified token/reactor addresses.

## Inventory architecture
The user's smart account should hold the USDT and cNGN inventory and be named as Textile's taker. The owner wallet administers/revokes permissions; a restricted session key delegates limited actions without owning funds. A separate USDT EOA cannot pay the smart account's costs unless a verified funding/relayer mechanism exists. Reserve funds are protected by backend policy, not merely by UI.

## Economic hypothesis
Textile's published Celo taker fee is 1 bps per swap and is already included in the effective quote rate. Thus it is not an extra subtraction if using the all-in effective quote, but both leg rates still matter. The maker spread is likewise embedded. Network gas and any conservative execution haircut remain separate. Realistic profitability can only be judged from live firm quotes and exact gas estimates across several days and order sizes.

## Release gate
Keep `FX_MODE=shadow` and `LIVE_EXECUTION_ENABLED=false` until the integration checklist in README is complete and audited.
