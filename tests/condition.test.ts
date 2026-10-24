import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOrderAgainstPrice } from '../src/exec/condition.js';

test('rejects orders without both approvals', () => {
  const order = {
    id: 'order-ok',
    valid_until: '2026-10-24T00:00:00.000Z',
    max_slippage_bps: 300,
    max_notional: 25,
    approvals: { D: true, E: false }
  };

  assert.equal(evaluateOrderAgainstPrice(order, 1.0), false);
});

test('accepts valid orders with approved path and sane limits', () => {
  const order = {
    id: 'order-ok',
    valid_until: '2026-10-24T00:00:00.000Z',
    max_slippage_bps: 300,
    max_notional: 25,
    approvals: { D: true, E: true }
  };

  assert.equal(evaluateOrderAgainstPrice(order, 1.0), true);
});
