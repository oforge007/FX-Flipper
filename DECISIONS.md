# FX Flipper decisions

- 2026-10-24: Created public repo `oforge007/FX-Flipper` to prototype a MiniPay + Celo safety-first agent rails system; goal is a dry-run, bounded auto-trading scaffold before any live execution.
- 2026-10-24: Chose a minimal TypeScript stack (`typescript`, `viem`, `zod`) to stay free-tier friendly, mobile-friendly, and easy to resume without Docker or heavy tooling.
- 2026-10-24: Followed the role architecture in `PLAN.md`: deterministic execution path (G→H→I) must remain code-only and never receive the private key or any LLM-derived secrets.
- 2026-10-24: Adopted a GitHub-backed append-only ledger model and a dry-run default so the system is auditable, resumable, and safe for slow internet and public-repo execution.
- 2026-10-24: Celopedia/official docs must be used for any Celo address or protocol fact; no invented contract addresses, ABIs, or x402 facilitator details are allowed.
