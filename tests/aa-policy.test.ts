import test from 'node:test';
import assert from 'node:assert/strict';
import { validateIntentPolicy } from '../src/aa/policy.js';

const policy = {
  maxAmountWei: 100_000n,
  maxSlippageBps: 300,
  maxDeadlineMs: 15 * 60_000,
  allowedTargets: ['0x1111111111111111111111111111111111111111'],
  allowedTokens: ['0x2222222222222222222222222222222222222222', '0x3333333333333333333333333333333333333333'],
  feeCurrency: '0x2222222222222222222222222222222222222222',
  enableSessionKeys: true
};

test('accepts a valid AA intent under the policy', () => {
  const intent = {
    id: 'aa-1',
    smartAccount: '0x1111111111111111111111111111111111111111',
    sessionKeyId: 'session-1',
    target: '0x1111111111111111111111111111111111111111',
    fromToken: '0x2222222222222222222222222222222222222222',
    toToken: '0x3333333333333333333333333333333333333333',
    amountIn: 50_000n,
    minAmountOut: 49_000n,
    maxSlippageBps: 250,
    deadline: new Date(Date.now() + 10 * 60_000).toISOString(),
    nonce: 1,
    feeCurrency: '0x2222222222222222222222222222222222222222',
    sourcePrice: 1.0
  };

  assert.equal(validateIntentPolicy(intent, policy).ok, true);
});

test('rejects unapproved tokens', () => {
  const intent = {
    id: 'aa-2',
    smartAccount: '0x1111111111111111111111111111111111111111',
    sessionKeyId: 'session-2',
    target: '0x1111111111111111111111111111111111111111',
    fromToken: '0x4444444444444444444444444444444444444444',
    toToken: '0x3333333333333333333333333333333333333333',
    amountIn: 10_000n,
    minAmountOut: 9_500n,
    maxSlippageBps: 200,
    deadline: new Date(Date.now() + 10 * 60_000).toISOString(),
    nonce: 2,
    feeCurrency: '0x2222222222222222222222222222222222222222',
    sourcePrice: 1.0
  };

  assert.equal(validateIntentPolicy(intent, policy).ok, false);
});
