export function computeExponentialBackoffMs(opts: {
  attemptCount: number;
  baseDelayMs: number;
  multiplier: number;
  maxDelayMs?: number;
}): number {
  const { attemptCount, baseDelayMs, multiplier, maxDelayMs } = opts;
  if (attemptCount < 1) throw new Error("attemptCount must be >= 1");
  if (baseDelayMs < 0) throw new Error("baseDelayMs must be >= 0");
  if (multiplier < 1) throw new Error("multiplier must be >= 1");

  const raw = baseDelayMs * Math.pow(multiplier, attemptCount - 1);
  const capped = maxDelayMs !== undefined ? Math.min(maxDelayMs, raw) : raw;
  return Math.max(0, Math.floor(capped));
}

