export const sourceSignalSchema = {
  type: 'object',
  properties: {
    source: { type: 'string' },
    author: { type: 'string' },
    ts: { type: 'string' },
    asset: { type: 'string' },
    horizon: { type: 'string' },
    direction: { type: 'string', enum: ['up', 'down', 'flat', 'no-view'] },
    quote_hash: { type: 'string' },
    url: { type: 'string' }
  },
  required: ['source', 'author', 'ts', 'asset', 'horizon', 'direction', 'quote_hash', 'url'],
  additionalProperties: false
};

export const orderSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    valid_until: { type: 'string' },
    max_slippage_bps: { type: 'number' },
    max_notional: { type: 'number' },
    approvals: {
      type: 'object',
      properties: {
        D: { type: 'boolean' },
        E: { type: 'boolean' }
      },
      required: ['D', 'E'],
      additionalProperties: false
    }
  },
  required: ['id', 'valid_until', 'max_slippage_bps', 'max_notional', 'approvals'],
  additionalProperties: false
};
