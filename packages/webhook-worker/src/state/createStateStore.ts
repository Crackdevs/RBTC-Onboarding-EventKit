import type { StateStore } from "./types.js";
import { createJsonStateStore } from "./jsonStateStore.js";
import { createSqliteStateStore } from "./sqliteStateStore.js";

export function createStateStore(opts: {
  storageMode: "sqlite" | "json";
  storagePath: string;
  onError?: (message: string) => void;
}): StateStore {
  if (opts.storageMode === "json") {
    return createJsonStateStore({ storagePath: opts.storagePath });
  }

  try {
    return createSqliteStateStore({ storagePath: opts.storagePath });
  } catch (err) {
    opts.onError?.(
      `sqlite state store init failed, falling back to json: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return createJsonStateStore({ storagePath: `${opts.storagePath}.json` });
  }
}

