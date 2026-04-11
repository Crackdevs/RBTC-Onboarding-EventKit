export type LogLevel = "debug" | "info" | "warn" | "error";

export type BackendAdapterKind = "generic" | "twoWp";

export interface WorkerEnv {
  backendAdapter: BackendAdapterKind;
  /** When set and `backendAdapter` is `twoWp`, used as the 2wp-api base URL instead of `backendBaseUrl`. */
  twoWpBaseUrl?: string;
  /** Required when `backendAdapter` is `twoWp` (RSK or BTC address for `GET /tx-history`). */
  twoWpTrackedAddress: string;
  /** `GET /tx-history` page (default 1). */
  twoWpHistoryPage: number;
  /** Parallel `GET /tx-status` requests per poll (default 4). */
  twoWpStatusConcurrency: number;

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

function parseBackendAdapter(raw: string | undefined): BackendAdapterKind {
  const v = (raw ?? "generic").trim().toLowerCase();
  if (v === "generic" || v === "") return "generic";
  if (v === "twowp" || v === "two_wp" || v === "two-wp" || v === "2wp") return "twoWp";
  throw new Error(
    `Invalid BACKEND_ADAPTER: ${raw}. Expected "generic" or "twoWp" (aliases: two_wp, 2wp).`
  );
}

export function loadWorkerEnv(): WorkerEnv {
  const backendAdapter = parseBackendAdapter(process.env.BACKEND_ADAPTER);

  const twoWpBaseUrl = process.env.TWO_WP_BASE_URL?.trim() || undefined;
  const backendBaseUrl =
    backendAdapter === "twoWp" && twoWpBaseUrl
      ? twoWpBaseUrl
      : requireEnv("BACKEND_BASE_URL");

  const twoWpTrackedAddress = process.env.TWO_WP_TRACKED_ADDRESS?.trim() ?? "";
  if (backendAdapter === "twoWp") {
    if (!twoWpTrackedAddress) {
      throw new Error("Missing TWO_WP_TRACKED_ADDRESS (required when BACKEND_ADAPTER=twoWp)");
    }
  }

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

  const twoWpHistoryPage = parseNumber(
    "TWO_WP_HISTORY_PAGE",
    process.env.TWO_WP_HISTORY_PAGE ?? "1",
    1
  );
  const twoWpStatusConcurrency = parseNumber(
    "TWO_WP_STATUS_CONCURRENCY",
    process.env.TWO_WP_STATUS_CONCURRENCY ?? "4",
    4
  );

  return {
    backendAdapter,
    twoWpBaseUrl,
    twoWpTrackedAddress,
    twoWpHistoryPage,
    twoWpStatusConcurrency,
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

