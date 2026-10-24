import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { LedgerEntry } from '../types.js';

export function appendLedgerEntry(entry: LedgerEntry): string {
  const ledgerDir = path.resolve(process.cwd(), 'ledger');
  const filePath = path.join(ledgerDir, 'trades.jsonl');

  mkdirSync(ledgerDir, { recursive: true });
  appendFileSync(filePath, `${JSON.stringify(entry)}\n`, 'utf8');

  return filePath;
}
