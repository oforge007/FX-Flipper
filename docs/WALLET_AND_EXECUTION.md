# Wallet and execution contract

## Roles

1. Owner/recovery EOA: deploys/administers the smart account and can revoke delegated authority.
2. Smart account: custody boundary for inventory. Holds the USDT used for entry, the cNGN bought, and the USDT returned on exit.
3. Session key: limited signer/delegate. It should be restricted to the Textile settlement target, the two token addresses, maximum amount, slippage, validity window, and the allowed cycle actions.
4. Backend: persistent strategy state, quote fetching, gas estimation, reserve checks, locking, idempotency and receipt reconciliation. No owner private key.
5. Textile FX: RFQ/filler routing and on-chain settlement. It does not hold user inventory.

## Required invariant

`cycle.status !== idle` means no new entry is permitted. The system can only transition:
`idle -> buy-pending -> position-open -> sell-pending -> idle`.
A failed or ambiguous sell moves to `reconciliation-required` and blocks further entries until chain state is reconciled.

## USDT gas reserve

A reserve should be recalculated using the exact expected transaction path:
`reserve = max(hardFloor, (estimatedGasPerSwap × plannedSwapCount × safetyMultiplier) + recoveryBuffer)`.
The implementation's function is an estimate and must be fed with current measurements. It does not query RPC itself. Do not allow browser input to override the backend's enforced floor or turn reserve protection off.

## Fee abstraction

For canonical Celo USDT, use the fee-currency adapter address in the transaction's feeCurrency field, not the token address. Validate the address is currently registered in Celo's FeeCurrencyDirectory. Account abstraction can introduce additional compatibility issues. Test the full smart-account -> bundler/paymaster -> Celo transaction route before trusting this mechanism. Otherwise keep a protected CELO gas balance in the smart account.
