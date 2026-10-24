import type { Order } from '../types.js';

export function validateOrder(order: Partial<Order>): boolean {
  if (!order || typeof order !== 'object') {
    return false;
  }

  if (!order.id || !order.valid_until) {
    return false;
  }

  if (typeof order.max_slippage_bps !== 'number' || order.max_slippage_bps < 0) {
    return false;
  }

  if (typeof order.max_notional !== 'number' || order.max_notional <= 0) {
    return false;
  }

  if (!order.approvals || order.approvals.D !== true || order.approvals.E !== true) {
    return false;
  }

  const expiry = new Date(order.valid_until).getTime();
  if (!Number.isFinite(expiry) || expiry <= Date.now()) {
    return false;
  }

  return true;
}

export function evaluateOrderAgainstPrice(
  order: Partial<Order>,
  price: number,
  now: number = Date.now(),
  staleMs: number = 45_000,
  maxSlippageBps: number = 500
): boolean {
  if (!validateOrder(order)) {
    return false;
  }

  if (!Number.isFinite(price) || price <= 0) {
    return false;
  }

  if (order.max_slippage_bps === undefined || order.max_slippage_bps > maxSlippageBps) {
    return false;
  }

  if (order.max_notional === undefined || order.max_notional <= 0) {
    return false;
  }

  const validUntil = new Date(order.valid_until as string).getTime();
  if (validUntil <= now || now - validUntil > staleMs) {
    return false;
  }

  return true;
}
