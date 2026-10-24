export function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function isDryRunEnabled(): boolean {
  return process.env.DRY_RUN !== 'false';
}
