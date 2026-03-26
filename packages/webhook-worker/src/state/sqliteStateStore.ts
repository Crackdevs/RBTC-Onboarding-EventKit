import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { PegInLifecycle } from "@rbtc-eventkit/sdk";
import type { RetryRecord, StateStore } from "./types.js";

function ensureDirForFile(filePath: string) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

export function createSqliteStateStore(opts: { storagePath: string }): StateStore {
  const storagePath = opts.storagePath;
  ensureDirForFile(storagePath);

  const db = new Database(storagePath);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS last_lifecycle (
      deposit_id TEXT PRIMARY KEY,
      lifecycle TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS processed_keys (
      idempotency_key TEXT PRIMARY KEY,
      processed_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS delivery_retries (
      idempotency_key TEXT PRIMARY KEY,
      deposit_id TEXT NOT NULL,
      lifecycle TEXT NOT NULL,
      attempt_count INTEGER NOT NULL,
      next_attempt_at INTEGER NOT NULL,
      raw_body TEXT NOT NULL,
      signature_hex TEXT NOT NULL,
      event TEXT NOT NULL,
      event_version TEXT NOT NULL,
      last_error TEXT
    );
  `);

  const getLastLifecycleStmt = db.prepare(
    "SELECT lifecycle FROM last_lifecycle WHERE deposit_id = ?"
  );
  const setLastLifecycleStmt = db.prepare(`
    INSERT INTO last_lifecycle(deposit_id, lifecycle)
    VALUES (?, ?)
    ON CONFLICT(deposit_id) DO UPDATE SET lifecycle = excluded.lifecycle
  `);

  const hasProcessedStmt = db.prepare(
    "SELECT 1 FROM processed_keys WHERE idempotency_key = ?"
  );
  const markProcessedStmt = db.prepare(`
    INSERT INTO processed_keys(idempotency_key, processed_at)
    VALUES (?, ?)
    ON CONFLICT(idempotency_key) DO NOTHING
  `);

  const upsertRetryStmt = db.prepare(`
    INSERT INTO delivery_retries(
      idempotency_key, deposit_id, lifecycle, attempt_count, next_attempt_at,
      raw_body, signature_hex, event, event_version, last_error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(idempotency_key) DO UPDATE SET
      deposit_id = excluded.deposit_id,
      lifecycle = excluded.lifecycle,
      attempt_count = excluded.attempt_count,
      next_attempt_at = excluded.next_attempt_at,
      raw_body = excluded.raw_body,
      signature_hex = excluded.signature_hex,
      event = excluded.event,
      event_version = excluded.event_version,
      last_error = excluded.last_error
  `);

  const deleteRetryStmt = db.prepare(
    "DELETE FROM delivery_retries WHERE idempotency_key = ?"
  );

  const getDueRetriesStmt = db.prepare(`
    SELECT
      idempotency_key, deposit_id, lifecycle, attempt_count, next_attempt_at,
      raw_body, signature_hex, event, event_version, last_error
    FROM delivery_retries
    WHERE next_attempt_at <= ?
    ORDER BY next_attempt_at ASC
  `);

  return {
    async getLastLifecycle(depositId: string) {
      const row = getLastLifecycleStmt.get(depositId) as
        | { lifecycle: string }
        | undefined;
      return (row?.lifecycle as PegInLifecycle) ?? null;
    },

    async setLastLifecycle(depositId: string, lifecycle: PegInLifecycle) {
      setLastLifecycleStmt.run(depositId, lifecycle);
    },

    async hasProcessedIdempotencyKey(idempotencyKey: string) {
      const row = hasProcessedStmt.get(idempotencyKey) as unknown;
      return row !== undefined;
    },

    async markProcessedIdempotencyKey(idempotencyKey: string) {
      markProcessedStmt.run(idempotencyKey, Date.now());
    },

    async upsertRetry(record: RetryRecord) {
      upsertRetryStmt.run(
        record.idempotencyKey,
        record.depositId,
        record.lifecycle,
        record.attemptCount,
        record.nextAttemptAt,
        record.rawBody,
        record.signatureHex,
        record.eventName,
        record.eventVersion,
        record.lastError ?? null
      );
    },

    async deleteRetry(idempotencyKey: string) {
      deleteRetryStmt.run(idempotencyKey);
    },

    async getDueRetries(nowMs: number) {
      const rows = getDueRetriesStmt.all(nowMs) as Array<{
        idempotency_key: string;
        deposit_id: string;
        lifecycle: string;
        attempt_count: number;
        next_attempt_at: number;
        raw_body: string;
        signature_hex: string;
        event: string;
        event_version: string;
        last_error: string | null;
      }>;

      return rows.map(
        (r) =>
          ({
            idempotencyKey: r.idempotency_key,
            depositId: r.deposit_id,
            lifecycle: r.lifecycle as PegInLifecycle,
            attemptCount: r.attempt_count,
            nextAttemptAt: r.next_attempt_at,
            rawBody: r.raw_body,
            signatureHex: r.signature_hex,
            eventName: r.event,
            eventVersion: r.event_version,
            lastError: r.last_error ?? undefined,
          }) satisfies RetryRecord
      );
    },
  };
}

