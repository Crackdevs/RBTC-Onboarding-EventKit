import type { BackendAdapter } from "../backendAdapter.js";
import type { TwoWpTxHistoryResponse, TwoWpTxHistoryRow } from "./twoWpTypes.js";
import { twoWpTxStatusJsonToDeposit } from "./mapTwoWpToDepositRow.js";

export interface TwoWpBackendAdapterOptions {
  baseUrl: string;
  trackedAddress: string;
  historyPage: number;
  /** Parallel `GET /tx-status` calls per poll tick. */
  statusConcurrency: number;
  fetchImpl?: typeof fetch;
}

function joinUrl(base: string, path: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function parseTxHistory(json: unknown): TwoWpTxHistoryRow[] {
  if (!json || typeof json !== "object") return [];
  const data = (json as TwoWpTxHistoryResponse).data;
  return Array.isArray(data) ? (data as TwoWpTxHistoryRow[]) : [];
}

async function fetchJson(
  fetchImpl: typeof fetch,
  url: string
): Promise<unknown> {
  const res = await fetchImpl(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`2wp-api fetch failed: ${res.status} ${res.statusText} (${url})`);
  }
  return res.json() as Promise<unknown>;
}

async function mapInBatches<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const limit = Math.max(1, concurrency);
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]!);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export function createTwoWpBackendAdapter(opts: TwoWpBackendAdapterOptions): BackendAdapter {
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;

  return {
    async fetchDepositStatuses() {
      const historyUrl = new URL(joinUrl(opts.baseUrl, "/tx-history"));
      historyUrl.searchParams.set("address", opts.trackedAddress);
      historyUrl.searchParams.set("page", String(opts.historyPage));

      const historyJson = await fetchJson(fetchImpl, historyUrl.toString());
      const rows = parseTxHistory(historyJson);

      const deposits = await mapInBatches(rows, opts.statusConcurrency, async (row) => {
        const txHash = typeof row.txHash === "string" ? row.txHash.trim() : "";
        if (!txHash) return null;
        const statusUrl = joinUrl(opts.baseUrl, `/tx-status/${encodeURIComponent(txHash)}`);
        const statusJson = await fetchJson(fetchImpl, statusUrl);
        return twoWpTxStatusJsonToDeposit(row, statusJson);
      });

      return deposits.filter((d): d is NonNullable<typeof d> => d !== null);
    },
  };
}
