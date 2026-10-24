import type { Order } from '../types.js';

export function evaluateOrderAgainstPrice(order: Order, price: number): boolean {
  if (!order.approvals.D || !order.approvals.E) {
    return false;
  }

  if (order.max_slippage_bps > 500) {
    return false;
  }

  if (order.max_notional <= 0) {
    return false;
  }

  return Number.isFinite(price) && price > 0;
}
