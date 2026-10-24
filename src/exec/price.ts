export type PriceSourceResult = {
  timestamp: number;
  pair: string;
  price: number;
  source: string;
  isStale: boolean;
};

const FALLBACK_PRICE = 1.0;

export function pollPrice(pair = 'CELO/USDT', fallbackPrice = FALLBACK_PRICE): PriceSourceResult {
  const timestamp = Date.now();

  return {
    timestamp,
    pair,
    price: fallbackPrice,
    source: 'manual-fallback',
    isStale: false
  };
}

export function validatePriceSources(
  primary: PriceSourceResult,
  secondary: PriceSourceResult,
  toleranceBps = 200,
  staleWindowMs = 45_000
): boolean {
  if (!primary || !secondary) {
    return false;
  }

  if (primary.isStale || secondary.isStale) {
    return false;
  }

  if (Date.now() - primary.timestamp > staleWindowMs) {
    return false;
  }

  const spreadRatio = Math.abs(primary.price - secondary.price) / Math.max(primary.price, secondary.price);
  const toleranceRatio = toleranceBps / 10000;

  return spreadRatio <= toleranceRatio;
}
