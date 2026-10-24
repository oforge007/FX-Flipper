export function dryRunSwap(_orderId: string): { ok: true; txHash: string } {
  return {
    ok: true,
    txHash: `0x${Math.random().toString(16).slice(2, 66)}`
  };
}
