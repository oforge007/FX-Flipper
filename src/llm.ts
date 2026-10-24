import { getEnv } from './env.js';

export interface LlmRequest {
  role: string;
  prompt: string;
  context?: Record<string, unknown>;
}

export interface LlmResponse {
  content: string;
  ok: boolean;
}

export async function callLlm(_request: LlmRequest): Promise<LlmResponse> {
  // Placeholder adapter: this repo intentionally avoids hard dependency on a specific free-tier LLM API.
  return {
    content: JSON.stringify({ status: 'mock', role: _request.role }),
    ok: true
  };
}

export function getLlmApiKey(): string {
  return getEnv('GITHUB_TOKEN');
}
