import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRoundTrip, calculateProtectedGasReserve } from '../src/strategy/round-trip-economics.js';

const base = {
  entrySpendUsdt: 100,
  expectedExitProceedsUsdt: 101,
  entryGasUsdt: 0.05,
  exitGasUsdt: 0.05,
  minNetProfitUsdt: 0.2,
  minNetMarginBps: 10,
  minTradeUsdt: 10,
  maxTradeUsdt: 500,
  usdtBalance: 200,
  protectedGasReserveUsdt: 1
};

test('eligible when expected round-trip profit clears costs and floors', () => {
  const r = evaluateRoundTrip({ ...base, executionHaircutBps: 5 });
  assert.equal(r.eligible, true);
  assert.ok(r.expectedNetPnlUsdt > 0.2);
});

test('rejects a cycle whose net margin is too small', () => {
  const r = evaluateRoundTrip({
    ...base,
    expectedExitProceedsUsdt: 100.1,
    minNetProfitUsdt: 0,
    minNetMarginBps: 10
  });
  assert.equal(r.eligible, false);
  assert.ok(r.reasons.includes('net-margin-below-floor') || r.reasons.includes('net-profit-below-floor'));
});

test('keeps protected reserve unavailable to entry spend', () => {
  const r = evaluateRoundTrip({ ...base, usdtBalance: 100.5, protectedGasReserveUsdt: 1 });
  assert.equal(r.eligible, false);
  assert.ok(r.reasons.includes('insufficient-balance-after-protected-gas-reserve'));
});

test('computes a reserve for two swaps plus recovery buffer', () => {
  assert.ok(Math.abs(calculateProtectedGasReserve({
    estimatedGasPerSwapUsdt: 0.02, expectedSwapCount: 2,
    safetyMultiplier: 3, recoveryBufferUsdt: 0.1, hardFloorUsdt: 0.2
  }) - 0.22) < 1e-9);
});
