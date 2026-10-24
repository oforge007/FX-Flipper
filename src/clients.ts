import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';

export const publicClient = createPublicClient({
  chain: celo,
  transport: http(process.env.CELO_RPC_URL || 'https://forno.celo.org')
});

export async function getLatestBlockNumber(): Promise<bigint> {
  return await publicClient.getBlockNumber();
}
