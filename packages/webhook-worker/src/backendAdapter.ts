import type { PegInLifecycle } from "@rbtc-eventkit/sdk";
import { normalizeStatus } from "@rbtc-eventkit/sdk";

export interface BackendDepositStatus {
  depositId: string;
  btcTxHash: string;

  // Raw status string from the backend. Worker normalizes it.
  sourceStatus: string;

  confirmations?: number;
  timestamp?: number;
}

export interface BackendAdapter {
  fetchDepositStatuses(): Promise<BackendDepositStatus[]>;
}

function asString(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return undefined;
  return String(v);
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export function createDefaultBackendAdapter(opts: {
  backendBaseUrl: string;
  backendDepositsPath: string;
}) : BackendAdapter {
  return {
    async fetchDepositStatuses() {
      const url = new URL(opts.backendDepositsPath, opts.backendBaseUrl).toString();
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) {
        throw new Error(`backend fetch failed: ${res.status} ${res.statusText}`);
      }

      const json: unknown = await res.json();
      const candidates: unknown[] = Array.isArray(json)
        ? json
        : Array.isArray((json as any)?.deposits)
          ? (json as any).deposits
          : [];

      const out: BackendDepositStatus[] = [];
      for (const c of candidates) {
        const depositId = asString((c as any)?.depositId) ?? asString((c as any)?.id);
        const btcTxHash = asString((c as any)?.btcTxHash) ?? asString((c as any)?.btcTx);
        const sourceStatus =
          asString((c as any)?.sourceStatus) ??
          asString((c as any)?.status) ??
          asString((c as any)?.backendStatus);
        if (!depositId || !btcTxHash || !sourceStatus) continue;

        out.push({
          depositId,
          btcTxHash,
          sourceStatus,
          confirmations: asNumber((c as any)?.confirmations),
          timestamp: asNumber((c as any)?.timestamp),
        });
      }

      return out;
    },
  };
}

export function normalizeBackendStatus(sourceStatus: string): PegInLifecycle {
  return normalizeStatus(sourceStatus);
}

