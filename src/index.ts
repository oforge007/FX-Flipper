import { pollPrice } from './exec/price.js';
import { evaluateOrderAgainstPrice } from './exec/condition.js';
import { dryRunSwap } from './exec/swap.js';
import { appendLedgerEntry } from './exec/ledger.js';

const order = {
  id: 'order-001',
  valid_until: new Date(Date.now() + 15 * 60_000).toISOString(),
  max_slippage_bps: 300,
  max_notional: 25,
  approvals: { D: true, E: true }
};

const price = pollPrice().price;
const shouldExecute = evaluateOrderAgainstPrice(order, price);

if (shouldExecute) {
  const result = dryRunSwap(order.id);
  appendLedgerEntry({
    ts: new Date().toISOString(),
    orderId: order.id,
    event: 'dry_run_swap_executed',
    details: { txHash: result.txHash, price }
  });
  console.log('Dry-run execution succeeded:', result.txHash);
} else {
  console.log('Dry-run execution skipped by policy gates.');
}
