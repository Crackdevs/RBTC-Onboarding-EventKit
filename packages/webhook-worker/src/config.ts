export type LogLevel = "debug" | "info" | "warn" | "error";

export interface WorkerEnv {
  backendBaseUrl: string;
  backendDepositsPath: string;
  pollIntervalMs: number;

  webhookEndpointUrl: string;
  webhookSecret: string;
  webhookEventName: string;
  webhookEventVersion: string;

  retryMaxAttempts: number;
  retryBaseDelayMs: number;
  retryMultiplier: number;
  storageMode: "sqlite" | "json";
  storagePath: string;

  logLevel: LogLevel;
}

function getEnv(name: string): string | undefined {
  return process.env[name];
}

function requireEnv(name: string): string {
  const v = getEnv(name);
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function parseNumber(name: string, value: string, fallback?: number): number {
  const n = Number(value);
  if (Number.isFinite(n)) return n;
  if (fallback !== undefined) return fallback;
  throw new Error(`Invalid number in env var ${name}: ${value}`);
}

export function loadWorkerEnv(): WorkerEnv {
  const backendBaseUrl = requireEnv("BACKEND_BASE_URL");
  const backendDepositsPath = process.env.BACKEND_DEPOSITS_PATH ?? "/deposits";

  const pollIntervalMs = parseNumber(
    "POLL_INTERVAL_MS",
    process.env.POLL_INTERVAL_MS ?? "5000",
    5000
  );

  const webhookEndpointUrl = requireEnv("WEBHOOK_ENDPOINT_URL");
  const webhookSecret = requireEnv("WEBHOOK_SECRET");
  const webhookEventName = process.env.WEBHOOK_EVENT_NAME ?? "rbtc.peg_in";
  const webhookEventVersion = process.env.WEBHOOK_EVENT_VERSION ?? "1";

  const retryMaxAttempts = parseNumber(
    "RETRY_MAX_ATTEMPTS",
    process.env.RETRY_MAX_ATTEMPTS ?? "5",
    5
  );
  const retryBaseDelayMs = parseNumber(
    "RETRY_BASE_DELAY_MS",
    process.env.RETRY_BASE_DELAY_MS ?? "1000",
    1000
  );
  const retryMultiplier = parseNumber(
    "RETRY_MULTIPLIER",
    process.env.RETRY_MULTIPLIER ?? "2",
    2
  );

  const storageMode = (process.env.STORAGE_MODE ?? "sqlite").toLowerCase();
  if (storageMode !== "sqlite" && storageMode !== "json") {
    throw new Error(`Invalid STORAGE_MODE: ${storageMode}`);
  }
  const storagePath = process.env.STORAGE_PATH ?? "./data/rbtc-eventkit.sqlite";

  const logLevel = (process.env.LOG_LEVEL ?? "info") as LogLevel;
  if (!["debug", "info", "warn", "error"].includes(logLevel)) {
    throw new Error(`Invalid LOG_LEVEL: ${logLevel}`);
  }

  return {
    backendBaseUrl,
    backendDepositsPath,
    pollIntervalMs,
    webhookEndpointUrl,
    webhookSecret,
    webhookEventName,
    webhookEventVersion,
    retryMaxAttempts,
    retryBaseDelayMs,
    retryMultiplier,
    storageMode: storageMode as "sqlite" | "json",
    storagePath,
    logLevel,
  };
}

