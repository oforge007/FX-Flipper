import type { LedgerEntry } from '../types.js';

export function appendLedgerEntry(entry: LedgerEntry): void {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // Real implementation would append to ledger/*.jsonl in a GitHub-backed append-only flow.
  // This stub ensures the code path is present and intentional.
  void entry;
}
