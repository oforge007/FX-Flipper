import { prepareIntentForSubmission } from './aa/intent.js';
import type { Intent, PolicyConfig } from './aa/types.js';
import { appendLedgerEntry } from './exec/ledger.js';
import { pollPrice, validatePriceSources } from './exec/price.js';

const policy: PolicyConfig = {
  maxAmountWei: 100_000n,
  maxSlippageBps: 300,
  maxDeadlineMs: 15 * 60_000,
  allowedTargets: ['0x1111111111111111111111111111111111111111' as const],
  allowedTokens: ['0x2222222222222222222222222222222222222222' as const, '0x3333333333333333333333333333333333333333' as const],
  feeCurrency: '0x2222222222222222222222222222222222222222' as const,
  enableSessionKeys: true
};

const buildIntent = (): Intent => ({
  id: 'intent-001',
  smartAccount: '0x1111111111111111111111111111111111111111',
  sessionKeyId: 'session-key-001',
  target: '0x1111111111111111111111111111111111111111',
  fromToken: '0x2222222222222222222222222222222222222222',
  toToken: '0x3333333333333333333333333333333333333333',
  amountIn: 50_000n,
  minAmountOut: 49_000n,
  maxSlippageBps: 250,
  deadline: new Date(Date.now() + 10 * 60_000).toISOString(),
  nonce: 1,
  feeCurrency: '0x2222222222222222222222222222222222222222',
  sourcePrice: 1.0
});

function main(): void {
  const primary = pollPrice('CELO/USDT', 1.0);
  const secondary = { ...primary, price: 1.0015, source: 'reference-source' };

  if (!validatePriceSources(primary, secondary, 200, 45_000)) {
    console.log('AA dry-run skipped: source spread exceeds tolerance.');
    return;
  }

  const intent = buildIntent();
  const prepared = prepareIntentForSubmission(intent, policy);

  if (!prepared.ok || !prepared.intent) {
    console.log(`AA dry-run rejected: ${prepared.reason ?? 'unknown-policy-failure'}`);
    return;
  }

  const ledgerFile = appendLedgerEntry({
    ts: new Date().toISOString(),
    orderId: intent.id,
    event: 'aa_dry_run_intent_accepted',
    details: {
      status: prepared.intent.status,
      userOpHash: prepared.intent.userOpHash,
      target: prepared.intent.target,
      fromToken: prepared.intent.fromToken,
      toToken: prepared.intent.toToken,
      feeCurrency: prepared.intent.feeCurrency,
      nonce: prepared.intent.nonce
    }
  });

  console.log(JSON.stringify({
    status: 'aa_dry_run_ok',
    intentId: intent.id,
    userOpHash: prepared.intent.userOpHash,
    ledgerFile,
    pair: primary.pair,
    price: primary.price
  }, null, 2));
}

main();
