export type PriceSourceResult = {
  timestamp: number;
  pair: string;
  price: number;
  source: string;
};

export function pollPrice(): PriceSourceResult {
  return {
    timestamp: Date.now(),
    pair: 'CELO/USDT',
    price: 1.0,
    source: 'manual-fallback'
  };
}
