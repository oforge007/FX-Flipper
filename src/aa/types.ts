export type Address = `0x${string}`;

export interface PolicyConfig {
  maxAmountWei: bigint;
  maxSlippageBps: number;
  maxDeadlineMs: number;
  allowedTargets: Address[];
  allowedTokens: Address[];
  feeCurrency?: Address;
  enableSessionKeys: boolean;
}

export interface Intent {
  id: string;
  smartAccount: Address;
  sessionKeyId: string;
  target: Address;
  fromToken: Address;
  toToken: Address;
  amountIn: bigint;
  minAmountOut: bigint;
  maxSlippageBps: number;
  deadline: string;
  nonce: number;
  feeCurrency?: Address;
  sourcePrice: number;
}

export interface SessionPermissions {
  target: Address;
  allowedTokens: Address[];
  maxAmountWei: bigint;
  maxSlippageBps: number;
  expiryMs: number;
}

export interface SignedIntent extends Intent {
  userOpHash?: string;
  status: 'dry-run' | 'ready' | 'rejected';
}
