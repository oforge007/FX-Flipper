export type SimulatedSwapResult = {
  ok: boolean;
  txHash: string;
  status: 'dry-run';
  price: number;
  maxSlippageBps: number;
};

export function dryRunSwap(
  orderId: string,
  price: number,
  maxSlippageBps: number,
  pseudoHash?: string
): SimulatedSwapResult {
  const txHash = pseudoHash ?? `0x${Math.random().toString(16).slice(2, 66)}`;

  return {
    ok: true,
    txHash,
    status: 'dry-run',
    price,
    maxSlippageBps
  };
}
