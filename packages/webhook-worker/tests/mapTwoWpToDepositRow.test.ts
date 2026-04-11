import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  mapTwoWpFlyoverPeginStatusToSourceStatus,
  mapTwoWpNativePeginStatusToSourceStatus,
  twoWpTxStatusJsonToDeposit,
} from "../src/twoWp/mapTwoWpToDepositRow.js";
import type { TwoWpTxHistoryRow } from "../src/twoWp/twoWpTypes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadFixture(name: string): unknown {
  const p = join(__dirname, "fixtures", "twoWp", name);
  return JSON.parse(readFileSync(p, "utf8")) as unknown;
}

const sampleHistoryRow: TwoWpTxHistoryRow = {
  txHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  userAddress: "0x1111111111111111111111111111111111111111",
  providerHash: "prov-1",
  date: "2026-01-15T12:00:00.000Z",
};

describe("mapTwoWpNativePeginStatusToSourceStatus", () => {
  it("maps all documented native peg-in statuses", () => {
    expect(mapTwoWpNativePeginStatusToSourceStatus("NOT_IN_BTC_YET")).toBe("detected");
    expect(mapTwoWpNativePeginStatusToSourceStatus("WAITING_CONFIRMATIONS")).toBe("confirming");
    expect(mapTwoWpNativePeginStatusToSourceStatus("NOT_IN_RSK_YET")).toBe("pending");
    expect(mapTwoWpNativePeginStatusToSourceStatus("CONFIRMED")).toBe("completed");
    expect(mapTwoWpNativePeginStatusToSourceStatus("REJECTED_NO_REFUND")).toBe("failed");
    expect(mapTwoWpNativePeginStatusToSourceStatus("REJECTED_REFUND")).toBe("failed");
    expect(mapTwoWpNativePeginStatusToSourceStatus("ERROR_NOT_A_PEGIN")).toBe("failed");
    expect(mapTwoWpNativePeginStatusToSourceStatus("ERROR_BELOW_MIN")).toBe("failed");
    expect(mapTwoWpNativePeginStatusToSourceStatus("ERROR_UNEXPECTED")).toBe("failed");
  });

  it("defaults unknown values to pending", () => {
    expect(mapTwoWpNativePeginStatusToSourceStatus("FUTURE_STATUS")).toBe("pending");
    expect(mapTwoWpNativePeginStatusToSourceStatus(null)).toBe("pending");
  });
});

describe("mapTwoWpFlyoverPeginStatusToSourceStatus", () => {
  it("maps flyover peg-in statuses", () => {
    expect(mapTwoWpFlyoverPeginStatusToSourceStatus("PENDING")).toBe("pending");
    expect(mapTwoWpFlyoverPeginStatusToSourceStatus("COMPLETED")).toBe("completed");
  });
});

describe("twoWpTxStatusJsonToDeposit", () => {
  it("parses fixture native PEGIN WAITING_CONFIRMATIONS", () => {
    const tx = loadFixture("tx-status-pegin-waiting-confirmations.json");
    const d = twoWpTxStatusJsonToDeposit(sampleHistoryRow, tx);
    expect(d).not.toBeNull();
    expect(d!.sourceStatus).toBe("confirming");
    expect(d!.btcTxHash).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(d!.depositId).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(d!.confirmations).toBe(3);
  });

  it("parses fixture native PEGIN CONFIRMED", () => {
    const row: TwoWpTxHistoryRow = {
      ...sampleHistoryRow,
      txHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    };
    const tx = loadFixture("tx-status-pegin-confirmed.json");
    const d = twoWpTxStatusJsonToDeposit(row, tx);
    expect(d).not.toBeNull();
    expect(d!.sourceStatus).toBe("completed");
  });

  it("parses fixture FLYOVER_PEGIN", () => {
    const row: TwoWpTxHistoryRow = {
      ...sampleHistoryRow,
      txHash: "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    };
    const tx = loadFixture("tx-status-flyover-pegin-pending.json");
    const d = twoWpTxStatusJsonToDeposit(row, tx);
    expect(d).not.toBeNull();
    expect(d!.sourceStatus).toBe("pending");
    expect(d!.btcTxHash).toBe("cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc");
  });

  it("returns null for non-pegin types", () => {
    expect(
      twoWpTxStatusJsonToDeposit(sampleHistoryRow, { type: "PEGOUT", txDetails: {} })
    ).toBeNull();
    expect(twoWpTxStatusJsonToDeposit(sampleHistoryRow, { type: "INVALID_DATA" })).toBeNull();
  });
});
