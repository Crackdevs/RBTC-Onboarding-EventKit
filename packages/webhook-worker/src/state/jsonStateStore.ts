import fs from "node:fs";
import path from "node:path";
import type { PegInLifecycle } from "@rbtc-eventkit/sdk";
import type { RetryRecord, StateStore } from "./types.js";

type PersistedState = {
  lastLifecycleByDepositId: Record<string, PegInLifecycle>;
  processedKeys: Record<string, true>;
  retriesByIdempotencyKey: Record<string, RetryRecord>;
};

function defaultState(): PersistedState {
  return {
    lastLifecycleByDepositId: {},
    processedKeys: {},
    retriesByIdempotencyKey: {},
  };
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const txt = fs.readFileSync(filePath, "utf8");
    return JSON.parse(txt) as T;
  } catch {
    return null;
  }
}

function atomicWriteJson(filePath: string, value: unknown) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(tmp, filePath);
}

export function createJsonStateStore(opts: { storagePath: string }): StateStore {
  const storagePath = opts.storagePath;
  const loaded = readJsonFile<PersistedState>(storagePath);
  const state: PersistedState = loaded ?? defaultState();

  async function persist() {
    atomicWriteJson(storagePath, state);
  }

  return {
    async getLastLifecycle(depositId: string) {
      return state.lastLifecycleByDepositId[depositId] ?? null;
    },

    async setLastLifecycle(depositId: string, lifecycle: PegInLifecycle) {
      state.lastLifecycleByDepositId[depositId] = lifecycle;
      await persist();
    },

    async hasProcessedIdempotencyKey(idempotencyKey: string) {
      return state.processedKeys[idempotencyKey] === true;
    },

    async markProcessedIdempotencyKey(idempotencyKey: string) {
      state.processedKeys[idempotencyKey] = true;
      await persist();
    },

    async upsertRetry(record: RetryRecord) {
      state.retriesByIdempotencyKey[record.idempotencyKey] = record;
      await persist();
    },

    async deleteRetry(idempotencyKey: string) {
      delete state.retriesByIdempotencyKey[idempotencyKey];
      await persist();
    },

    async getDueRetries(nowMs: number) {
      const due: RetryRecord[] = [];
      for (const record of Object.values(state.retriesByIdempotencyKey)) {
        if (record.nextAttemptAt <= nowMs) due.push(record);
      }
      return due.sort((a, b) => a.nextAttemptAt - b.nextAttemptAt);
    },
  };
}

