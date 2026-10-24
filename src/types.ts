export type RoleName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N';

export interface PriceTick {
  timestamp: number;
  pair: string;
  price: number;
  source: string;
}

export interface Order {
  id: string;
  valid_until: string;
  max_slippage_bps: number;
  max_notional: number;
  approvals: {
    D: boolean;
    E: boolean;
  };
}

export interface LedgerEntry {
  ts: string;
  orderId?: string;
  event: string;
  details: Record<string, unknown>;
}
