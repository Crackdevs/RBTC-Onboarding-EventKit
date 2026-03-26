import fs from "node:fs";
import path from "node:path";
import type { PegInLifecycle } from "@rbtc-eventkit/sdk";

export type ExchangeState = {
  processedKeys: Record<string, true>;
  creditsByDepositId: Record<string, true>;
  lastLifecycleByDepositId: Record<string, PegInLifecycle>;
};

function atomicWriteJson(filePath: string, value: unknown) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(tmp, filePath);
}

export function createExchangeStateStore(opts: { storagePath: string }) {
  const storagePath = opts.storagePath;
  const initial: ExchangeState = {
    processedKeys: {},
    creditsByDepositId: {},
    lastLifecycleByDepositId: {},
  };

  let state = initial;
  if (fs.existsSync(storagePath)) {
    try {
      state = { ...initial, ...(JSON.parse(fs.readFileSync(storagePath, "utf8")) as any) };
    } catch {
      state = initial;
    }
  }

  const persist = () => atomicWriteJson(storagePath, state);

  return {
    hasProcessed(idempotencyKey: string) {
      return state.processedKeys[idempotencyKey] === true;
    },
    markProcessed(idempotencyKey: string) {
      state.processedKeys[idempotencyKey] = true;
      persist();
    },
    setLastLifecycle(depositId: string, lifecycle: PegInLifecycle) {
      state.lastLifecycleByDepositId[depositId] = lifecycle;
      persist();
    },
    hasCredited(depositId: string) {
      return state.creditsByDepositId[depositId] === true;
    },
    credit(depositId: string) {
      state.creditsByDepositId[depositId] = true;
      persist();
    },
  };
}

