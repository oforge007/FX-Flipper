# FX Flipper Plan

## 0. How to use this document

1. Put this file in the repo root as `PLAN.md`.
2. Start Claude Code and say: *"Read PLAN.md. Follow section 12 (working rules). Start with Milestone 0 and stop after each milestone for my review."*
3. Keep `DECISIONS.md` updated (one line per decision: what, why, date).

## 1. Constraints (design drivers)

The builder has: Android phone, free Claude / ChatGPT / GitHub / Vercel plans, slow internet, occasional access to a university PC.

Consequences:
- Tiny dependencies, small installs. Prefer TypeScript + `viem` only. No heavy frameworks, no Docker.
- Everything must be resumable: each step commits small, so a dropped connection loses little.
- Free-tier friendly compute: Vercel Hobby cron is limited (about daily). Use GitHub Actions cron (free for public repos, minimum 5 min interval) for the execution loop. Optional: run the loop in Termux on the phone or on the uni PC for faster polling.
- Free-tier LLMs: provider-agnostic LLM adapter (`llm.ts`) so any free API tier can be used; cache aggressively; run analysis roles only on a schedule (e.g. every 1–4 h), never per price tick.
- GitHub is the database: append-only `ledger/*.jsonl` files committed by the bot (free, auditable, versioned).

## 2. Key design decisions (read before coding)

1. 14 "bots" are roles, not 14 processes. Split them into two classes:
   - LLM roles (judgment): A, B, C, D, E, F, K, L, M, N.
   - Deterministic code roles (no LLM, no creativity): G (price feed), H (condition evaluator), I (executor), J (ledger).
   Money-moving path (G → H → I) must be plain code. An LLM must never hold or touch the private key.
2. x402 is not a swap mechanism. x402 is an HTTP-402 pay-per-request protocol. Use it where it fits: (a) the agent pays for data/tools (Master’s "buy tools/info" budget), (b) the agent exposes a paid endpoint (e.g. its signal/report). Swaps themselves are direct DEX contract calls (see 5). Verify current x402 support on Celo via Celopedia before building.
3. Squid Router is unnecessary for single-chain CELO/USDT spot trading. Use it only if the later "MiniPay onboarding" plan needs cross-chain funding. Default: on-chain DEX on Celo directly.
4. Verify, never assume, on-chain facts. Token addresses, DEX router/pool addresses, ERC-8004 registry addresses, x402 facilitator: pull from Celopedia / official docs and write them to `config/addresses.json` with a source URL per entry. Check whether Uniswap v4 is deployed and liquid for CELO/USDT on Celo; if not, fall back to the best verified venue (e.g. Uniswap v3). Do not hallucinate addresses.
5. Self-modifying Master is sandboxed. M may change parameters and prompts (config files) within hard bounds, never executor code, key handling, or limits. See section 7.
6. Human stays in the loop: Nina (N) reports to the human; the human can pause everything via a kill switch.

## 3. Architecture

```text
SOCIAL → A (collect) → B (analyze: 1h/4h/1d/1w/1M + range)
      → C (fact/logic check) → D (trading plan)
      → E (hub: re-verifies full chain) → F (turns plan into machine order)
      → [D + E must approve F's order]
      → G (price feed, code) ─┐
                              ├→ H (condition check, code) → I (executor, code, holds key)
      F's approved order ─────┘                               │
                                                               ▼
                                                        J (ledger, code)
                                                               ▼
                                         K (report) → L (improvements) → M (master)
                                                               ▲             │
                                                               └── N (Nina) ←┘ audits M → human
```

### Data contracts (JSON schemas in `/schemas`, validated with `zod`)
- `SourceSignal` (A→B): `{source, author, ts, asset, horizon, direction, quote_hash, url}` (store short excerpt, link, not full copied text).
- `Analysis` (B→C): per horizon `{direction: "up"|"down", confidence, rationale}`, plus `range: {low, high, basis}`.
- `ReviewedAnalysis` (C→D): analysis + `issues[]`, `corrections[]`, `verdict`.
- `TradePlan` (D→E): rules such as `{buy_below, buy_pct_capital, sell_above, sell_pct_holdings, valid_until}`.
- `Order` (F→H): fully machine-readable, with `id`, `valid_until`, `max_slippage_bps`, `max_notional`, `approvals: {D, E}`.
- `LedgerEntry` (J): every input hash, decision, tx hash, fill price, slippage, balances before/after.

Each hop writes its output to `runs/<run_id>/<role>.json`. Every role receives only what its description allows, but E, K, L, M, N get read access to the entire run folder.

## 4. Roles in detail

| Role | Type | Job | Hard rules |
|---|---|---|---|
| A | LLM + fetchers | Read configured accounts/feeds, extract BTC/ETH direction per horizon | Source list in `config/sources.json`; pluggable fetchers; no scraping that violates ToS |
| B | LLM | Weigh signals, output direction per horizon (1h, 4h, 1d, 1w, 1M) and swing range | Must cite signal IDs; must output "no view" if data is thin |
| C | LLM | Check factual and logical consistency, flag unsupported claims | May veto → pipeline stops for this cycle |
| D | LLM | Build plan within `limits.json` | Cannot exceed per-trade % or max exposure |
| E | LLM | Re-trace the full chain, approve/reject | Rejection stops cycle |
| F | LLM + validator | Convert plan to deterministic Order | Order must pass the schema and limits check in code |
| G | code | Poll CELO/USDT price (DEX quote + a second reference source) | Flag if sources deviate more than X% |
| H | code | Evaluate `Order` conditions against G's price | Pure function, unit-tested |
| I | code | Sign and send swap when H triggers | Only role with key; enforces limits independent of upstream |
| J | code | Append `LedgerEntry`, commit to repo | Append-only |
| K | LLM | Post-trade report on decision chain | |
| L | LLM | Concrete improvement proposals | |
| M | LLM | Apply bounded changes (see 7) | Budget-limited, logged |
| N | LLM | Audit M, write report for the human | Read-only on M's actions |

## 5. Execution layer (G, H, I)

- Library: `viem` with Celo chain config. Wallet: dedicated hot wallet with a small capped balance, never a main wallet.
- Price: get quotes from the chosen DEX quoter contract; cross-check with one independent source; refuse to trade if they diverge or data is stale.
- Swap: approve exact amount (not unlimited), swap with `minAmountOut` derived from the quote and `max_slippage_bps` (start 500 = 5%, tune downward via M within bounds).
- Wait for receipt, record gas and fill in the ledger.
- Add idempotency: every `Order.id` can execute once per trigger; persist state before sending a tx.
- Dry-run mode (default): same flow, but only simulates the tx (`eth_call`/`simulateContract`) and logs. Live mode requires explicit config flag.
- Kill switch: `config/PAUSED` file or env flag checked by I before every action.
- Key handling: key lives only as a GitHub Actions secret / local env var, read only by the executor step. Never log it, never pass it to an LLM, never commit it. Add secret scanning (e.g. `gitleaks` pre-commit) to the repo.

## 6. Hard safety limits (`config/limits.json`, changeable only by the human)

- Max single trade: e.g. 10% of capital, absolute cap in USDT.
- Max total exposure to CELO; daily max number of trades; daily max loss → auto-pause.
- Min time between trades; max slippage ceiling; only whitelisted tokens and router contracts.
- Max Master budget spend per day.
- Order expiry; stale-price rejection.

Limits are enforced inside I, regardless of what upstream roles say. Upstream LLM output is untrusted input.

## 7. Master (M) and Nina (N)

- Master budget: 25% of realized profits (stablecoin), tracked as a separate ledger account. Funds only exist after profit is realized; if profit is negative, budget is zero.
- Spending: only to a whitelist of tool/data providers via x402 (amount caps per call and per day), logged by J.
- M's allowed changes: prompts, source weights, horizon weights, thresholds, slippage within [min, max] — via pull requests / config commits on a `master/` branch with a diff and reason. Auto-merge only if a test and backtest/paper-trade check passes.
- M may not change: `limits.json`, executor code, key handling, whitelists, its own budget share.
- N reads M's commits and spending, writes `reports/nina-YYYY-MM-DD.md` with concrete recommendations for the human, and can set `PAUSED` if M violates bounds.

## 8. Identity, payments, hackathon requirements

- ERC-8004: register the agent identity on Celo (use Celopedia to get the current registry address and registration flow). Publish an agent card (name, description, endpoints, supported trust models). Keep the card in `public/agent.json`.
- x402: implement (a) a client helper `payForResource()` used by M for purchases, and (b) one paid endpoint, e.g. `/api/report` returning the latest sanitized strategy report for a small fee. Use a verified facilitator; test on testnet first if available.
- Hackathon: confirm submission requirements, deadline, and demo format via Loophouse before Milestone 4. Record a short demo (dry-run + one small live trade).
- Load the Celopedia skill whenever touching Celo-specific details and cite what it returned in `DECISIONS.md`.

## 9. Repo layout

```text
/config        sources.json, limits.json, addresses.json, prompts/
/schemas       zod schemas
/src/roles     a.ts … n.ts
/src/exec      price.ts, condition.ts, swap.ts, ledger.ts
/src/llm.ts    provider adapter + cache
/src/x402      client.ts, server.ts
/ledger        trades.jsonl (append-only)
/runs          per-cycle outputs
/reports       K, L, N reports
/public        agent.json, dashboard
/.github/workflows  analyze.yml (every 1–4h), execute.yml (every 5 min)
/tests         unit tests for H, I limits, schemas
DECISIONS.md   PLAN.md   README.md
```

## 10. Milestones (each small enough for phone + slow internet)

**M0 — Skeleton (1 session).** Repo, TypeScript, zod schemas, config files, `DECISIONS.md`, secret scanning, README with architecture diagram. No network calls yet.

**M1 — Deterministic core (G, H, I, J) in dry-run.** Price poller, condition evaluator with unit tests, simulated swap, ledger. Verify addresses via Celopedia. Run on GitHub Actions cron. Exit criteria: a fake order triggers a simulated swap and a ledger line is committed.

**M2 — Analysis chain (A–F).** Start with A using one simple free source plus a manual `signals.json` fallback; add more fetchers later. LLM adapter with caching and a mock mode so tests need no API. Exit: one full cycle produces an `Order` that passes validation and D+E approvals.

**M3 — Live micro-trade.** Fund the hot wallet with a tiny amount, enable live mode behind the flag, execute one real swap, verify in the ledger and on a block explorer. Tune slippage downward afterwards.

**M4 — Agent rails.** ERC-8004 registration + agent card, x402 paid endpoint and client. Dashboard page on Vercel (static, reads ledger and reports from the repo).

**M5 — Meta loop (K, L, M, N).** Reports, proposals, bounded self-modification via PRs, Master budget accounting, Nina's reports. Exit: one full meta cycle with Nina's report.

**M6 — Polish for submission.** README, demo video/script, honest "limitations and risks" section, fork-and-run instructions ("copy this bot": set secrets, edit `sources.json`, `limits.json`).

Minimum viable demo if time runs out: M0–M4 (dry-run plus one tiny live trade, with identity and x402).

## 11. "Copyable for many users" (design for it from the start)

- All user-specific values in config/secrets, none hard-coded.
- One-command setup script and a checklist README: fork repo → add secrets → set limits → run in dry-run.
- Each user gets their own wallet and keys; never custody other people's keys or funds in a shared service. If the later MiniPay wallet-onboarding idea involves users exporting private keys into the bot, treat that as high risk: document it clearly, restrict to small dedicated wallets, and consider session keys or smart-account permissions as a safer later upgrade.
- Add risk disclosure and a "not financial advice" notice. If the product is offered to third parties, legal review is needed (regulatory treatment of automated trading tools differs by jurisdiction).

## 12. Working rules for Claude Code

- Before each milestone: summarize the plan in 5 lines, wait for approval.
- Small commits, working state after each; no large downloads, no heavy dependencies; explain any new dependency.
- Prefer unit tests for H and the I limits; mock the LLM and RPC in tests.
- Never print or store secrets; use `.env.example` only.
- Never invent contract addresses, ABIs, or API details: look them up (Celopedia/official docs) and record the source.
- Default to dry-run; any change that enables live trading must be an explicit, separate commit.
- At the end of each session update `DECISIONS.md` and a short `STATUS.md` ("done / next / blockers") so work can continue from a different device.

## 13. Known risks (state them honestly in the README)

- LLM-derived trading signals from social media are noisy and manipulable; expect losses. Frame the project as an agent-architecture and safety demo, not a profit machine.
- Prompt injection from social posts into A/B: treat all fetched text as untrusted data; strip instructions, pass only structured fields downstream.
- Thin DEX liquidity on CELO pairs → slippage and MEV risk; keep trades small.
- Free-tier rate limits and cron jitter: 5-minute polling cannot catch fast wicks; limit orders on-chain are a possible later upgrade.
- Self-modifying agent: bounded changes plus Nina plus the kill switch are essential.
