import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOrderAgainstPrice } from '../src/exec/condition.js';

test('rejects orders without both approvals', () => {
  const order = {
    id: 'order-reject',
    valid_until: new Date(Date.now() + 15 * 60_000).toISOString(),
    max_slippage_bps: 300,
    max_notional: 25,
    approvals: { D: true, E: false }
  };

  assert.equal(evaluateOrderAgainstPrice(order, 1.0), false);
});

test('accepts valid orders with approved path and sane limits', () => {
  const order = {
    id: 'order-ok',
    valid_until: new Date(Date.now() + 15 * 60_000).toISOString(),
    max_slippage_bps: 300,
    max_notional: 25,
    approvals: { D: true, E: true }
  };

  assert.equal(evaluateOrderAgainstPrice(order, 1.0), true);
});

test('rejects expired orders', () => {
  const order = {
    id: 'order-expired',
    valid_until: new Date(Date.now() - 60_000).toISOString(),
    max_slippage_bps: 300,
    max_notional: 25,
    approvals: { D: true, E: true }
  };

  assert.equal(evaluateOrderAgainstPrice(order, 1.0), false);
});
