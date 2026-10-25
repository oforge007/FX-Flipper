import type { Address, Intent, PolicyConfig, SignedIntent } from './types.js';

const isAddress = (value: string): value is Address => /^0x[a-fA-F0-9]{40}$/.test(value);

export function validateIntentPolicy(
  intent: Intent,
  policy: PolicyConfig,
  now = Date.now()
): { ok: boolean; reason?: string } {
  if (!isAddress(intent.smartAccount) || !isAddress(intent.target) || !isAddress(intent.fromToken) || !isAddress(intent.toToken)) {
    return { ok: false, reason: 'invalid-address' };
  }

  if (!policy.allowedTargets.includes(intent.target)) {
    return { ok: false, reason: 'target-not-whitelisted' };
  }

  if (!policy.allowedTokens.includes(intent.fromToken) || !policy.allowedTokens.includes(intent.toToken)) {
    return { ok: false, reason: 'token-not-whitelisted' };
  }

  if (intent.amountIn > policy.maxAmountWei) {
    return { ok: false, reason: 'amount-exceeds-cap' };
  }

  if (intent.maxSlippageBps > policy.maxSlippageBps) {
    return { ok: false, reason: 'slippage-exceeds-policy' };
  }

  const deadlineMs = new Date(intent.deadline).getTime();
  if (Number.isNaN(deadlineMs) || deadlineMs <= now || deadlineMs - now > policy.maxDeadlineMs) {
    return { ok: false, reason: 'deadline-invalid-or-stale' };
  }

  if (intent.feeCurrency && policy.feeCurrency && intent.feeCurrency !== policy.feeCurrency) {
    return { ok: false, reason: 'fee-currency-mismatch' };
  }

  if (intent.minAmountOut <= 0n) {
    return { ok: false, reason: 'min-amount-out-invalid' };
  }

  return { ok: true };
}

export function buildDryRunSignedIntent(intent: Intent): SignedIntent {
  return {
    ...intent,
    status: 'dry-run',
    userOpHash: `0x${Math.random().toString(16).slice(2, 66)}`
  };
}
