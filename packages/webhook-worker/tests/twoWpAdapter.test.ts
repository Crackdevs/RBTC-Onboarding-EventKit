import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createTwoWpBackendAdapter } from "../src/twoWp/twoWpAdapter.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadFixture(name: string): unknown {
  return JSON.parse(
    readFileSync(join(__dirname, "fixtures", "twoWp", name), "utf8")
  ) as unknown;
}

describe("createTwoWpBackendAdapter", () => {
  it("fetches tx-history then tx-status per row (no real network)", async () => {
    const history = loadFixture("tx-history.sample.json");
    const status = loadFixture("tx-status-pegin-waiting-confirmations.json");

    const calls: string[] = [];
    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      calls.push(url);
      if (url.includes("/tx-history")) {
        return new Response(JSON.stringify(history), { status: 200 });
      }
      if (url.includes("/tx-status/")) {
        return new Response(JSON.stringify(status), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    };

    const adapter = createTwoWpBackendAdapter({
      baseUrl: "https://2wp.example",
      trackedAddress: "0x1111111111111111111111111111111111111111",
      historyPage: 1,
      statusConcurrency: 2,
      fetchImpl: fetchImpl as typeof fetch,
    });

    const rows = await adapter.fetchDepositStatuses();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.sourceStatus).toBe("confirming");
    expect(calls.some((u) => u.includes("/tx-history?"))).toBe(true);
    expect(calls.some((u) => u.includes("/tx-status/"))).toBe(true);
  });
});
