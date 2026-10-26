# Round-trip economics notes

## Avoid double-counting

A Textile firm quote's effective rate already includes the Textile taker fee and maker spread. The Celo taker fee documented by Textile is 1 bps per leg. If the input `expectedExitProceedsUsdt` is computed from a real effective exit quote and the entry spend is based on the real effective entry quote, do **not** subtract the 1 bps fee again.

The `executionHaircutBps` input is a stress allowance for adverse execution/quote deterioration, not a protocol fee. With a firm wallet-bound quote, the quote should either execute at the signed terms before expiry or fail/revert; the haircut is a conservative strategy buffer. Calibrate it from observed data and avoid counting any cost twice.

## Gas estimation

Do not hardcode a Celo gas amount as a stable dollar value. For each exact transaction:
1. Build the real approval or swap calldata for the correct smart-account taker.
2. Run `eth_estimateGas` against the intended execution path.
3. Read current fee/gas parameters using the chain client.
4. Estimate the network charge for the actual fee currency and adapter.
5. After a test transaction, compare the estimate with receipt `gasUsed`, effective gas price, and actual fee-currency debit.

USDT fee abstraction adds material gas overhead compared with native CELO. Published Celo measurements have shown USDT fee-currency transfers around 115k gas median, versus roughly 44k when paying in CELO for the same simple transfer; this is not a swap estimate. Swap transaction gas can be significantly different and must be measured from actual calldata.

## Sensitivity examples

At $100 notional:
- 2 bps of total protocol fee equivalent = $0.02, though Textile includes it in effective quotes.
- 5 bps adverse round-trip haircut = $0.05.
- 10 bps = $0.10.
- 25 bps = $0.25.

At $1,000 notional:
- 2 bps = $0.20.
- 5 bps = $0.50.
- 10 bps = $1.00.
- 25 bps = $2.50.

These are arithmetic illustrations, not forecasts of actual spread or gas. A quote can be worse for the exact size or unavailable entirely.

## Suggested shadow data

Persist at least:
- timestamp, chain, taker address, token addresses and amount;
- quote request/response IDs, firm effective rate, expected output, expiry;
- gas estimate and fee-currency choice for each leg;
- expected P&L, required minimum, decision and rejection reason;
- if executed in a separately approved test, transaction hash, receipt, actual fee, token deltas and realized P&L.

Analyze eligible opportunities, rejected opportunities, no-quote frequency, quote expiry, expected-vs-realized gas, expected-vs-realized P&L, and profit distribution by trade size. Do not optimize for quote volume alone.
