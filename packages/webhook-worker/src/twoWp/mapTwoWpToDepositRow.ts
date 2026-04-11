import type { BackendDepositStatus } from "../backendAdapter.js";
import type { TwoWpTxHistoryRow } from "./twoWpTypes.js";

/** Native peg-in aggregate status from 2wp-api `PeginStatus.status`. */
export const TwoWpNativePeginStatuses = [
  "NOT_IN_BTC_YET",
  "WAITING_CONFIRMATIONS",
  "NOT_IN_RSK_YET",
  "CONFIRMED",
  "REJECTED_NO_REFUND",
  "REJECTED_REFUND",
  "ERROR_NOT_A_PEGIN",
  "ERROR_BELOW_MIN",
  "ERROR_UNEXPECTED",
] as const;

export type TwoWpNativePeginStatus = (typeof TwoWpNativePeginStatuses)[number];

const FLYOVER_PEGIN_STATUSES = ["PENDING", "COMPLETED"] as const;

function strip0x(h: string): string {
  return h.startsWith("0x") || h.startsWith("0X") ? h.slice(2) : h;
}

function asNonEmptyString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return undefined;
}

/**
 * Maps 2wp-api native `PeginStatus.status` strings to `sourceStatus` values
 * understood by `normalizeStatus()` in the SDK (primary Milestone 1 table).
 *
 * | 2wp-api status | sourceStatus (→ lifecycle via normalizeStatus) |
 * | -------------- | ------------------------------------------------- |
 * | NOT_IN_BTC_YET | detected |
 * | WAITING_CONFIRMATIONS | confirming |
 * | NOT_IN_RSK_YET | pending |
 * | CONFIRMED | completed |
 * | REJECTED_* / ERROR_* | failed |
 * | unknown | pending (safe default) |
 */
export function mapTwoWpNativePeginStatusToSourceStatus(status: unknown): string {
  const s = asNonEmptyString(status);
  if (!s) return "pending";

  switch (s as TwoWpNativePeginStatus) {
    case "NOT_IN_BTC_YET":
      return "detected";
    case "WAITING_CONFIRMATIONS":
      return "confirming";
    case "NOT_IN_RSK_YET":
      return "pending";
    case "CONFIRMED":
      return "completed";
    case "REJECTED_NO_REFUND":
    case "REJECTED_REFUND":
    case "ERROR_NOT_A_PEGIN":
    case "ERROR_BELOW_MIN":
    case "ERROR_UNEXPECTED":
      return "failed";
    default:
      return "pending";
  }
}

/**
 * Flyover peg-in `FlyoverStatuses` → sourceStatus strings.
 */
export function mapTwoWpFlyoverPeginStatusToSourceStatus(status: unknown): string {
  const s = asNonEmptyString(status);
  if (!s) return "pending";
  if ((FLYOVER_PEGIN_STATUSES as readonly string[]).includes(s)) {
    if (s === "COMPLETED") return "completed";
    return "pending";
  }
  return "pending";
}

function parseTimestampSeconds(btc: Record<string, unknown>, historyRow: TwoWpTxHistoryRow): number | undefined {
  const cd = btc.creationDate;
  if (typeof cd === "string" || typeof cd === "number") {
    const d = new Date(cd);
    const t = Math.floor(d.getTime() / 1000);
    if (Number.isFinite(t)) return t;
  }
  const hd = historyRow.date;
  if (typeof hd === "string" || typeof hd === "number") {
    const d = new Date(hd);
    const t = Math.floor(d.getTime() / 1000);
    if (Number.isFinite(t)) return t;
  }
  return undefined;
}

function peginDetailsToDeposit(
  historyRow: TwoWpTxHistoryRow,
  txDetails: Record<string, unknown>
): BackendDepositStatus | null {
  const btc = txDetails.btc;
  if (!btc || typeof btc !== "object") return null;

  const b = btc as Record<string, unknown>;
  const btcTxRaw = asNonEmptyString(b.txId) ?? historyRow.txHash;
  const btcTxHash = strip0x(btcTxRaw);
  const depositId = strip0x(historyRow.txHash);

  const sourceStatus = mapTwoWpNativePeginStatusToSourceStatus(txDetails.status);

  return {
    depositId,
    btcTxHash,
    sourceStatus,
    confirmations: asNumber(b.confirmations),
    timestamp: parseTimestampSeconds(b, historyRow),
  };
}

function flyoverPeginDetailsToDeposit(
  historyRow: TwoWpTxHistoryRow,
  txDetails: Record<string, unknown>
): BackendDepositStatus | null {
  const txHashRaw = asNonEmptyString(txDetails.txHash) ?? historyRow.txHash;
  const btcTxHash = strip0x(txHashRaw);
  const depositId = strip0x(historyRow.txHash);
  const sourceStatus = mapTwoWpFlyoverPeginStatusToSourceStatus(txDetails.status);

  let timestamp: number | undefined;
  const fd = txDetails.date;
  if (typeof fd === "string" || typeof fd === "number") {
    const d = new Date(fd);
    const t = Math.floor(d.getTime() / 1000);
    if (Number.isFinite(t)) timestamp = t;
  }
  if (timestamp === undefined) timestamp = parseTimestampSeconds({}, historyRow);

  return {
    depositId,
    btcTxHash,
    sourceStatus,
    confirmations: undefined,
    timestamp,
  };
}

/**
 * Combine one tx-history row with the JSON body of `GET /tx-status/{txId}`.
 * Returns `null` when the response is not a peg-in the worker maps in Milestone 1.
 */
export function twoWpTxStatusJsonToDeposit(
  historyRow: TwoWpTxHistoryRow,
  txStatusJson: unknown
): BackendDepositStatus | null {
  if (!txStatusJson || typeof txStatusJson !== "object") return null;
  const o = txStatusJson as { type?: unknown; txDetails?: unknown };
  const type = asNonEmptyString(o.type);
  const txDetails = o.txDetails;
  if (!type || !txDetails || typeof txDetails !== "object") return null;

  const d = txDetails as Record<string, unknown>;
  if (type === "PEGIN") return peginDetailsToDeposit(historyRow, d);
  if (type === "FLYOVER_PEGIN") return flyoverPeginDetailsToDeposit(historyRow, d);
  return null;
}
