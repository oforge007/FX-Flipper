import type { Address, SessionPermissions } from './types.js';

export function buildSessionPermissions(
  target: Address,
  allowedTokens: Address[],
  maxAmountWei: bigint,
  maxSlippageBps: number,
  expiryMs: number
): SessionPermissions {
  return {
    target,
    allowedTokens,
    maxAmountWei,
    maxSlippageBps,
    expiryMs
  };
}

export function buildSessionKeyDescriptor(sessionKeyId: string, target: Address): { sessionKeyId: string; target: Address; type: 'dry-run-session-key' } {
  return {
    sessionKeyId,
    target,
    type: 'dry-run-session-key'
  };
}
