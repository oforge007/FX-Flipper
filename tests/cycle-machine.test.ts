import test from 'node:test';
import assert from 'node:assert/strict';
import { transitionCycle } from '../src/strategy/cycle-machine.js';
import type { CycleState } from '../src/strategy/cycle-machine.js';

test('requires confirmed sell before a second buy', () => {
  let state: CycleState = { status: 'idle' };
  state = transitionCycle(state, { type: 'BUY_SUBMITTED', cycleId: 'c1', entryUsdt: 20, now: 1 });
  state = transitionCycle(state, { type: 'BUY_CONFIRMED', acquiredCngn: 30000 });
  assert.throws(() => transitionCycle(state, { type: 'BUY_SUBMITTED', cycleId: 'c2', entryUsdt: 20, now: 2 }), /cycle-already-open/);
  state = transitionCycle(state, { type: 'SELL_SUBMITTED' });
  state = transitionCycle(state, { type: 'SELL_CONFIRMED' });
  assert.equal(state.status, 'idle');
});

test('failed sell requires reconciliation and blocks another cycle', () => {
  let state: CycleState = { status: 'idle' };
  state = transitionCycle(state, { type: 'BUY_SUBMITTED', cycleId: 'c1', entryUsdt: 20, now: 1 });
  state = transitionCycle(state, { type: 'BUY_CONFIRMED', acquiredCngn: 30000 });
  state = transitionCycle(state, { type: 'SELL_SUBMITTED' });
  state = transitionCycle(state, { type: 'SELL_FAILED', reason: 'receipt-timeout' });
  assert.equal(state.status, 'reconciliation-required');
  assert.throws(() => transitionCycle(state, { type: 'BUY_SUBMITTED', cycleId: 'c2', entryUsdt: 20, now: 2 }), /cycle-already-open/);
  state = transitionCycle(state, { type: 'RECONCILED_CLOSED' });
  assert.equal(state.status, 'idle');
});
