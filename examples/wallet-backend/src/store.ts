import fs from "node:fs";
import path from "node:path";
import type { PegInLifecycle } from "@rbtc-eventkit/sdk";

export type WalletState = {
  depositsById: Record<string, PegInLifecycle>;
  processedKeys: Record<string, true>;
};

function atomicWriteJson(filePath: string, value: unknown) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(tmp, filePath);
}

export function createWalletStateStore(opts: { storagePath: string }) {
  const storagePath = opts.storagePath;
  const initial: WalletState = {
    depositsById: {},
    processedKeys: {},
  };

  let state = initial;
  if (fs.existsSync(storagePath)) {
    try {
      state = { ...initial, ...(JSON.parse(fs.readFileSync(storagePath, "utf8")) as any) };
    } catch {
      state = initial;
    }
  }

  function persist() {
    atomicWriteJson(storagePath, state);
  }

  return {
    hasProcessed(idempotencyKey: string) {
      return state.processedKeys[idempotencyKey] === true;
    },
    markProcessed(idempotencyKey: string) {
      state.processedKeys[idempotencyKey] = true;
      persist();
    },
    setDepositLifecycle(depositId: string, lifecycle: PegInLifecycle) {
      state.depositsById[depositId] = lifecycle;
      persist();
    },
    getDepositLifecycle(depositId: string) {
      return state.depositsById[depositId] ?? null;
    },
  };
}

