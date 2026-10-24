import { z } from 'zod';

export const SourceSignalSchema = z.object({
  source: z.string(),
  author: z.string(),
  ts: z.string(),
  asset: z.string(),
  horizon: z.string(),
  direction: z.enum(['up', 'down', 'flat', 'no-view']),
  quote_hash: z.string(),
  url: z.string()
});

export const OrderSchema = z.object({
  id: z.string(),
  valid_until: z.string(),
  max_slippage_bps: z.number().min(0),
  max_notional: z.number().min(0),
  approvals: z.object({
    D: z.boolean(),
    E: z.boolean()
  })
});

export type SourceSignal = z.infer<typeof SourceSignalSchema>;
export type Order = z.infer<typeof OrderSchema>;
