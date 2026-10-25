import type { Intent, PolicyConfig } from './types.js';
import { buildDryRunSignedIntent, validateIntentPolicy } from './policy.js';

export function prepareIntentForSubmission(
  intent: Intent,
  policy: PolicyConfig
): { ok: boolean; reason?: string; intent?: ReturnType<typeof buildDryRunSignedIntent> } {
  const validation = validateIntentPolicy(intent, policy);
  if (!validation.ok) {
    return { ok: false, reason: validation.reason };
  }

  return {
    ok: true,
    intent: buildDryRunSignedIntent(intent)
  };
}
