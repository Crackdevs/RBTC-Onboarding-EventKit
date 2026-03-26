import { describe, expect, it } from "vitest";
import { computeExponentialBackoffMs } from "../src/retry/backoff.js";

describe("computeExponentialBackoffMs", () => {
  it("uses baseDelay * multiplier^(attempt-1)", () => {
    expect(
      computeExponentialBackoffMs({
        attemptCount: 1,
        baseDelayMs: 1000,
        multiplier: 2,
      })
    ).toBe(1000);

    expect(
      computeExponentialBackoffMs({
        attemptCount: 2,
        baseDelayMs: 1000,
        multiplier: 2,
      })
    ).toBe(2000);

    expect(
      computeExponentialBackoffMs({
        attemptCount: 3,
        baseDelayMs: 1000,
        multiplier: 2,
      })
    ).toBe(4000);
  });
});

