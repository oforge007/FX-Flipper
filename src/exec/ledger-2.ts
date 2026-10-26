import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export interface LedgerEntry {
  ts: string;
  event: string;
  cycleId?: string;
  details: Record<string, string | number | boolean | null>;
}

export function appendLedgerEntry(entry: LedgerEntry): string {
  const dir = path.resolve(process.cwd(), 'ledger');
  const file = path.join(dir, 'events.jsonl');
  mkdirSync(dir, { recursive: true });
  appendFileSync(file, `${JSON.stringify(entry)}\n`, 'utf8');
  return file;
}
