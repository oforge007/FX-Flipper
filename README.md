# FX Flipper — cNGN/USDT paired-cycle agent

**Status: shadow-mode scaffold. Not mainnet-ready.** This repository includes a round-trip economics engine, policy gates, an interactive cost calculator, a cycle state machine, a JSONL event ledger, and tests. It does not yet request live Textile RFQs, sign transactions, submit UserOperations, or execute swaps.

## What it is trying to do

FX Flipper monitors the Celo `cNGN/USDT` corridor. A cycle starts by spending a bounded amount of USDT to buy cNGN, then sells the resulting cNGN back to USDT only when the expected realized round-trip economics satisfy configured rules. It must confirm the sell before it can begin another buy.

The strategy should not try to manufacture activity. Stable FX pairs can stay inside a narrow band for long periods. The system should skip trades when the quoted round-trip edge cannot cover execution costs and a profit buffer.

## Wallet and inventory model

**Recommended MVP: the smart account itself holds the trading inventory.**

- **Owner/recovery wallet:** controlled by the user; sets up and can revoke the smart account/session permissions.
- **Smart account:** holds USDT and cNGN inventory. Swap proceeds return to this same address because Textile's quote is bound to the taker address.
- **Session key:** a limited delegate that can request/submit only allowed cNGN/USDT swaps under amount, target, slippage, expiry, reserve, and cycle-state restrictions. It does not hold the inventory and must not be an unrestricted key.
- **Backend worker:** obtains quotes, estimates costs, evaluates policies, persists cycle state, and prepares transactions. It must not receive the owner wallet's private key.
- **Gas reserve:** kept in the smart account's USDT balance (or an explicitly configured separate gas wallet only if the wallet/executor supports and verifies that design). The reserve is unavailable to the buy-sizing function.

If USDT is held in a separate EOA while the smart account is the Textile taker, the EOA's balance is not automatically available to the smart account. You would need an explicit funding/transfer step, which itself has fees and introduces a second balance to reconcile. Avoid this in the MVP.

### Celo fee currency caution

Celo supports fee abstraction for USDT, but canonical six-decimal USDT uses the **fee-currency adapter address**, not the USDT token address, in the transaction's `feeCurrency` field. A smart-account/UserOperation stack must be tested end-to-end for this specific path. Do not assume a generic ERC-4337 bundler or account implementation passes Celo's fee-currency fields correctly. If that path fails, the smart account needs a separately protected native CELO gas balance or a verified compatible paymaster/relayer. Never allow the strategy to consume the gas reserve.

## Round-trip cost logic

The strategy works from executable, size-specific quotes, not a manually entered midpoint.

- Textile's published Celo taker fee is 1 basis point per swap, already included in the effective quote rate. Across a buy and sell, the protocol component is therefore about 2 bps of notional before the maker spread and any other costs. Do not subtract it again if the quote is already all-in.
- The maker's spread is also included in the effective quote.
- Gas is estimated separately for each transaction and converted to USDT using the selected fee-currency path and actual chain parameters.
- A slippage setting is a **worst-case execution guard**, not automatically a realized fee. For profitability checks, the model applies a conservative adverse-execution haircut to each leg, but live code must avoid double-counting anything already included in a firm quote.
- First-time token approvals can add one-off transactions. They are not counted as recurring swap gas, but the initial setup cost should be amortized across an explicit expected number of cycles if you want an all-in deployment ROI.

The core model calculates:
`expectedNetUsdt = estimatedSellProceeds - initialUsdtSpend - entryGasUsdt - exitGasUsdt - otherUnincludedCostsUsdt - conservativeExecutionHaircutUsdt`

A candidate is eligible only when:
1. a live firm quote exists for the full size and has not expired;
2. the round-trip expected net exceeds `minNetProfitUsdt` **and** `minNetMarginBps`;
3. the trade is within the maximum size and the protected USDT gas reserve;
4. there is no open cycle;
5. the quote, token addresses, taker address, chain, and execution path pass server-side checks.

## Example: why the calculator matters

For a $1,000 notional, a 2 bps protocol-fee component is about $0.20 across both legs, but this is already reflected in the quoted effective rates. A further 5 bps adverse round-trip rate move would be another ~$0.50; a 10 bps move would be ~$1.00. Gas may be small on Celo, but the actual amount depends on the exact swap calldata, gas price, whether USDT fee abstraction is used, and the wallet/account-abstraction path. Do not hardcode a gas-dollar figure. Estimate gas from the exact transactions and verify actual receipts.

## Modes and safety

- **Shadow mode:** records quotes and hypothetical decisions only. No approvals, signatures, broadcasts, or transfers.
- **Manual mode:** user-triggered swaps only after the same quote and policy checks.
- **Agent mode:** not implemented as a live executor in this scaffold. Do not enable it until the integration checklist below is completed.

Hard guardrails:
- cNGN/USDT (or USDC only where explicitly enabled); reject unrelated tokens/protocols.
- Only one open paired cycle at a time.
- Never buy more cNGN while a cNGN position is open.
- Require a confirmed sell before a new buy.
- Persist cycle state and use idempotency keys so restarts cannot duplicate orders.
- Use firm quote expiry and minimum-output protections.
- Keep a protected USDT reserve: greater of configured floor and `gas estimate × safety multiplier + recovery buffer`.
- Enforce limits on the backend; browser controls are not security boundaries.
- Emergency stop blocks new entries immediately. Exit behavior on a stuck/loss-making position must be explicit and reviewed.
- Record every quote, rejection reason, intent, transaction hash, receipt, gas cost, and realized P&L.
- No automatic “keep holding forever”: configure max holding time and reviewed exit/stop-loss policy before live use.

## Install and run

Requires Node.js 20+ and npm.

```bash
npm install
npm test
npm run build
npm run start
npm run ui
```

- `npm test`: deterministic economics and state-machine tests.
- `npm run start`: prints a safe shadow-mode example; does not submit transactions.
- `npm run ui`: serves the static dashboard at `http://localhost:8000`.

## UI

Open `http://localhost:8000`. The calculator is illustrative: input gas and quote assumptions are not live estimates. Replace them with live quote and `eth_estimateGas` adapters before using the output for any trade decision.

## Integration checklist before any live trade

- [ ] Confirm canonical Celo USDT and cNGN contract addresses from authoritative sources.
- [ ] Confirm Textile FX Celo reactor/settlement integration and quote API schema.
- [ ] Request real firm quotes for both legs at the exact size; persist raw quote and expiry.
- [ ] Verify the taker address is the smart account that owns inventory.
- [ ] Test wallet signing/execution and USDT fee-currency adapter support on Celo mainnet with tiny amounts.
- [ ] If using account abstraction, verify the bundler/paymaster path accepts Celo fee currency and the UserOperation executes as expected.
- [ ] Estimate gas for each exact transaction; reconcile receipt gasUsed × effectiveGasPrice / feeCurrency charged.
- [ ] Add server-side storage, locking, idempotency, transaction reconciliation, and alerting.
- [ ] Verify event attribution requirements and the exact encoding before any hackathon-counted transaction.
- [ ] Run shadow mode across multiple days and sizes; compare predicted vs realized quote economics.
- [ ] Define and test max hold, stop-loss, emergency stop, restart recovery, and manual override.
- [ ] Get a security review; do not expose private keys or unrestricted signing credentials to the browser or LLM.

## References

- Textile FX fees: https://fx-docs.textilecredit.com/fees
- Textile FX quote/settlement flow: https://fx-docs.textilecredit.com/how-it-works
- Textile FX protocol overview: https://fx-docs.textilecredit.com/protocol/
- Celo fee abstraction: https://docs.celo.org/developer/fee-currency
- This repository intentionally leaves all contract addresses and live executor wiring disabled until verified.
