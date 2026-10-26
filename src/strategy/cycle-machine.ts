export type CycleState =
  | { status: 'idle'; cycleId?: never; entryUsdt?: never; acquiredCngn?: never; openedAt?: never }
  | { status: 'buy-pending'; cycleId: string; entryUsdt: number; openedAt: number }
  | { status: 'position-open'; cycleId: string; entryUsdt: number; acquiredCngn: number; openedAt: number }
  | { status: 'sell-pending'; cycleId: string; entryUsdt: number; acquiredCngn: number; openedAt: number }
  | { status: 'reconciliation-required'; cycleId: string; reason: string };

export type CycleEvent =
  | { type: 'BUY_SUBMITTED'; cycleId: string; entryUsdt: number; now: number }
  | { type: 'BUY_CONFIRMED'; acquiredCngn: number }
  | { type: 'BUY_FAILED' }
  | { type: 'SELL_SUBMITTED' }
  | { type: 'SELL_CONFIRMED' }
  | { type: 'SELL_FAILED'; reason: string }
  | { type: 'RECONCILED_CLOSED' };

export function transitionCycle(state: CycleState, event: CycleEvent): CycleState {
  switch (event.type) {
    case 'BUY_SUBMITTED':
      if (state.status !== 'idle') throw new Error('cycle-already-open');
      if (!(event.entryUsdt > 0) || !Number.isFinite(event.entryUsdt)) throw new Error('invalid-entry-size');
      return { status: 'buy-pending', cycleId: event.cycleId, entryUsdt: event.entryUsdt, openedAt: event.now };
    case 'BUY_CONFIRMED':
      if (state.status !== 'buy-pending') throw new Error('buy-not-pending');
      if (!(event.acquiredCngn > 0) || !Number.isFinite(event.acquiredCngn)) throw new Error('invalid-acquired-amount');
      return { ...state, status: 'position-open', acquiredCngn: event.acquiredCngn };
    case 'BUY_FAILED':
      if (state.status !== 'buy-pending') throw new Error('buy-not-pending');
      return { status: 'idle' };
    case 'SELL_SUBMITTED':
      if (state.status !== 'position-open') throw new Error('no-open-position-to-sell');
      return { ...state, status: 'sell-pending' };
    case 'SELL_CONFIRMED':
      if (state.status !== 'sell-pending') throw new Error('sell-not-pending');
      return { status: 'idle' };
    case 'SELL_FAILED':
      if (state.status !== 'sell-pending') throw new Error('sell-not-pending');
      return { status: 'reconciliation-required', cycleId: state.cycleId, reason: event.reason };
    case 'RECONCILED_CLOSED':
      if (state.status !== 'reconciliation-required') throw new Error('reconciliation-not-required');
      return { status: 'idle' };
  }
}
