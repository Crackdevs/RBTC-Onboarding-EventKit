import type { PegInLifecycle } from "@rbtc-eventkit/sdk";

export interface RetryRecord {
  idempotencyKey: string;
  depositId: string;
  lifecycle: PegInLifecycle;
  attemptCount: number;
  nextAttemptAt: number;

  rawBody: string;
  signatureHex: string;

  eventName: string;
  eventVersion: string;

  lastError?: string;
}

export interface StateStore {
  getLastLifecycle(depositId: string): Promise<PegInLifecycle | null>;
  setLastLifecycle(depositId: string, lifecycle: PegInLifecycle): Promise<void>;

  hasProcessedIdempotencyKey(idempotencyKey: string): Promise<boolean>;
  markProcessedIdempotencyKey(idempotencyKey: string): Promise<void>;

  upsertRetry(record: RetryRecord): Promise<void>;
  deleteRetry(idempotencyKey: string): Promise<void>;
  getDueRetries(nowMs: number): Promise<RetryRecord[]>;
}

