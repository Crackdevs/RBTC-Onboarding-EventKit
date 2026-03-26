import { describe, expect, it } from "vitest";
import { normalizeStatus } from "../src/normalizeStatus.js";
import { isPegInLifecycle } from "../src/normalizeStatus.js";

describe("normalizeStatus", () => {
  it("maps known aliases to canonical lifecycle", () => {
    expect(normalizeStatus("DETECTED")).toBe("detected");
    expect(normalizeStatus("found")).toBe("detected");
    expect(normalizeStatus("processing")).toBe("pending");
    expect(normalizeStatus("confirm")).toBe("confirming");
    expect(normalizeStatus("confirmed_completed")).toBe("completed");
    expect(normalizeStatus("error")).toBe("failed");
  });

  it("defaults unknown statuses safely", () => {
    expect(normalizeStatus("some-unknown-status")).toBe("pending");
  });

  it("isPegInLifecycle validates", () => {
    expect(isPegInLifecycle("completed")).toBe(true);
    expect(isPegInLifecycle("nope")).toBe(false);
    expect(isPegInLifecycle(null)).toBe(false);
  });
});

