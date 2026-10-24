import { pollPrice, validatePriceSources } from './exec/price.js';
import { evaluateOrderAgainstPrice } from './exec/condition.js';
import { dryRunSwap } from './exec/swap.js';
import { appendLedgerEntry } from './exec/ledger.js';

const buildOrder = () => ({
  id: 'order-001',
  valid_until: new Date(Date.now() + 15 * 60_000).toISOString(),
  max_slippage_bps: 300,
  max_notional: 25,
  approvals: { D: true, E: true }
});

function main(): void {
  const primary = pollPrice('CELO/USDT', 1.0);
  const secondary = {
    ...primary,
    price: 1.0015,
    source: 'reference-source'
  };

  if (!validatePriceSources(primary, secondary, 200, 45_000)) {
    console.log('Dry-run skipped: source spread exceeds tolerance.');
    return;
  }

  const order = buildOrder();
  if (!evaluateOrderAgainstPrice(order, primary.price)) {
    console.log('Dry-run skipped: order failed validation rules.');
    return;
  }

  const result = dryRunSwap(order.id, primary.price, order.max_slippage_bps);
  const ledgerPath = appendLedgerEntry({
    ts: new Date().toISOString(),
    orderId: order.id,
    event: 'dry_run_swap_executed',
    details: {
      txHash: result.txHash,
      status: result.status,
      price: result.price,
      maxSlippageBps: result.maxSlippageBps,
      ledgerFile: ledgerPath
    }
  });

  console.log(JSON.stringify({
    orderId: order.id,
    txHash: result.txHash,
    ledgerFile: ledgerPath,
    pair: primary.pair,
    price: primary.price,
    status: 'dry_run_ok'
  }, null, 2));
}

main();
