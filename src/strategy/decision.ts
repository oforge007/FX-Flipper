import type { RoundTripInput, RoundTripResult } from './round-trip-economics.js';
import { evaluateRoundTrip } from './round-trip-economics.js';
import type { CycleState } from './cycle-machine.js';

export interface CandidateContext {
  input: RoundTripInput;
  cycle: CycleState;
  emergencyStop: boolean;
  shadowMode: boolean;
  quoteValid: boolean;
  quoteExpired: boolean;
  pair: string;
  chainId: number;
}

export interface CandidateDecision {
  acceptedForSimulation: boolean;
  maySubmitLiveTransaction: false;
  reasons: string[];
  economics: RoundTripResult;
}

/** Intentionally cannot authorize a live transaction. Execution adapter is not implemented. */
export function evaluateCandidate(context: CandidateContext): CandidateDecision {
  const economics = evaluateRoundTrip(context.input);
  const reasons = [...economics.reasons];
  if (context.pair !== 'cNGN/USDT') reasons.push('unsupported-pair');
  if (context.chainId !== 42220) reasons.push('unsupported-chain');
  if (context.cycle.status !== 'idle') reasons.push('cycle-already-open');
  if (context.emergencyStop) reasons.push('emergency-stop-enabled');
  if (!context.quoteValid) reasons.push('firm-quote-required');
  if (context.quoteExpired) reasons.push('quote-expired');
  if (!context.shadowMode) reasons.push('live-execution-not-implemented');

  return {
    acceptedForSimulation: reasons.length === 0,
    maySubmitLiveTransaction: false,
    reasons,
    economics
  };
}
