import { evaluateRoundTrip, calculateProtectedGasReserve } from './strategy/round-trip-economics.js';
import { appendLedgerEntry } from './exec/ledger.js';

const reserve = calculateProtectedGasReserve({
  estimatedGasPerSwapUsdt: 0.03,
  expectedSwapCount: 2,
  safetyMultiplier: 3,
  recoveryBufferUsdt: 0.10,
  hardFloorUsdt: 0.25
});

const result = evaluateRoundTrip({
  entrySpendUsdt: 100,
  expectedExitProceedsUsdt: 100.45,
  entryGasUsdt: 0.03,
  exitGasUsdt: 0.03,
  otherCostsUsdt: 0,
  executionHaircutBps: 5,
  minNetProfitUsdt: 0.10,
  minNetMarginBps: 10,
  minTradeUsdt: 25,
  maxTradeUsdt: 250,
  usdtBalance: 150,
  protectedGasReserveUsdt: reserve
});

const ledgerFile = appendLedgerEntry({
  ts: new Date().toISOString(),
  event: 'shadow_round_trip_evaluated',
  cycleId: 'example-shadow-cycle',
  details: {
    mode: 'shadow',
    pair: 'cNGN/USDT',
    expectedNetPnlUsdt: Number(result.expectedNetPnlUsdt.toFixed(6)),
    expectedNetMarginBps: Number(result.expectedNetMarginBps.toFixed(3)),
    eligible: result.eligible,
    reasons: result.reasons.join(',')
  }
});

console.log(JSON.stringify({
  mode: 'shadow',
  liveExecutionEnabled: false,
  pair: 'cNGN/USDT',
  protectedGasReserveUsdt: reserve,
  economics: result,
  ledgerFile,
  note: 'Illustrative inputs only. No live quote, signature, approval, or transaction was requested.'
}, null, 2));
