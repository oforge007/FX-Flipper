export interface RoundTripInput {
  /** USDT notional spent to buy cNGN. */
  entrySpendUsdt: number;
  /** Estimated USDT proceeds from selling the acquired cNGN, based on an executable firm quote. */
  expectedExitProceedsUsdt: number;
  /** Gas estimate for entry swap, converted into USDT. */
  entryGasUsdt: number;
  /** Gas estimate for exit swap, converted into USDT. */
  exitGasUsdt: number;
  /** Other costs not already included in the effective quotes. */
  otherCostsUsdt?: number;
  /** Conservative adverse-execution haircut, in basis points across the whole round trip. */
  executionHaircutBps?: number;
  /** Required absolute net profit, in USDT. */
  minNetProfitUsdt: number;
  /** Required net profit relative to entry spend, in basis points. */
  minNetMarginBps: number;
  /** Do not enter below this notional. */
  minTradeUsdt: number;
  /** Max amount of USDT the strategy may spend on one entry. */
  maxTradeUsdt: number;
  /** Available USDT balance in the smart account. */
  usdtBalance: number;
  /** Protected gas reserve; not spendable as trade inventory. */
  protectedGasReserveUsdt: number;
}

export interface RoundTripResult {
  valid: boolean;
  eligible: boolean;
  reasons: string[];
  entrySpendUsdt: number;
  expectedExitProceedsUsdt: number;
  grossPnlUsdt: number;
  entryGasUsdt: number;
  exitGasUsdt: number;
  otherCostsUsdt: number;
  executionHaircutUsdt: number;
  expectedNetPnlUsdt: number;
  expectedNetMarginBps: number;
  breakEvenExitProceedsUsdt: number;
  minimumExitProceedsForTargetUsdt: number;
}

const finiteNonNegative = (n: number): boolean => Number.isFinite(n) && n >= 0;

export function evaluateRoundTrip(input: RoundTripInput): RoundTripResult {
  const otherCostsUsdt = input.otherCostsUsdt ?? 0;
  const haircutBps = input.executionHaircutBps ?? 0;
  const numericValues = [
    input.entrySpendUsdt, input.expectedExitProceedsUsdt, input.entryGasUsdt,
    input.exitGasUsdt, otherCostsUsdt, haircutBps, input.minNetProfitUsdt,
    input.minNetMarginBps, input.minTradeUsdt, input.maxTradeUsdt,
    input.usdtBalance, input.protectedGasReserveUsdt
  ];
  const valid = numericValues.every(finiteNonNegative) && haircutBps < 10_000;

  const reasons: string[] = [];
  if (!valid) reasons.push('invalid-or-negative-input');
  if (input.entrySpendUsdt <= 0) reasons.push('entry-spend-must-be-positive');
  if (input.entrySpendUsdt < input.minTradeUsdt) reasons.push('below-minimum-trade');
  if (input.entrySpendUsdt > input.maxTradeUsdt) reasons.push('above-maximum-trade');
  if (input.entrySpendUsdt + input.protectedGasReserveUsdt > input.usdtBalance) {
    reasons.push('insufficient-balance-after-protected-gas-reserve');
  }

  const grossPnlUsdt = input.expectedExitProceedsUsdt - input.entrySpendUsdt;
  const executionHaircutUsdt = input.expectedExitProceedsUsdt * (haircutBps / 10_000);
  const expectedNetPnlUsdt = grossPnlUsdt - input.entryGasUsdt - input.exitGasUsdt
    - otherCostsUsdt - executionHaircutUsdt;
  const expectedNetMarginBps = input.entrySpendUsdt > 0
    ? (expectedNetPnlUsdt / input.entrySpendUsdt) * 10_000
    : Number.NEGATIVE_INFINITY;
  const breakEvenExitProceedsUsdt = input.entrySpendUsdt + input.entryGasUsdt
    + input.exitGasUsdt + otherCostsUsdt;
  const minimumExitProceedsForTargetUsdt =
    (input.entrySpendUsdt + input.entryGasUsdt + input.exitGasUsdt + otherCostsUsdt
      + input.minNetProfitUsdt) / (1 - haircutBps / 10_000);

  if (expectedNetPnlUsdt < input.minNetProfitUsdt) reasons.push('net-profit-below-floor');
  if (expectedNetMarginBps < input.minNetMarginBps) reasons.push('net-margin-below-floor');

  return {
    valid,
    eligible: valid && reasons.length === 0,
    reasons,
    entrySpendUsdt: input.entrySpendUsdt,
    expectedExitProceedsUsdt: input.expectedExitProceedsUsdt,
    grossPnlUsdt,
    entryGasUsdt: input.entryGasUsdt,
    exitGasUsdt: input.exitGasUsdt,
    otherCostsUsdt,
    executionHaircutUsdt,
    expectedNetPnlUsdt,
    expectedNetMarginBps,
    breakEvenExitProceedsUsdt,
    minimumExitProceedsForTargetUsdt
  };
}

/**
 * Reserve enough USDT for both legs plus a recovery buffer.
 * This is a policy estimate, not a replacement for actual fee estimation.
 */
export function calculateProtectedGasReserve(input: {
  estimatedGasPerSwapUsdt: number;
  expectedSwapCount: number;
  safetyMultiplier: number;
  recoveryBufferUsdt: number;
  hardFloorUsdt: number;
}): number {
  const values = [
    input.estimatedGasPerSwapUsdt, input.expectedSwapCount,
    input.safetyMultiplier, input.recoveryBufferUsdt, input.hardFloorUsdt
  ];
  if (!values.every(finiteNonNegative) || input.expectedSwapCount < 2 || input.safetyMultiplier < 1) {
    throw new Error('invalid-gas-reserve-input');
  }
  const estimated = input.estimatedGasPerSwapUsdt * input.expectedSwapCount * input.safetyMultiplier
    + input.recoveryBufferUsdt;
  return Math.max(input.hardFloorUsdt, estimated);
}
