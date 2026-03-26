import { describe, expect, it } from "vitest";
import { getIdempotencyKey } from "../src/idempotency.js";

describe("getIdempotencyKey", () => {
  it("formats depositId:lifecycle", () => {
    expect(getIdempotencyKey("dep1", "completed")).toBe("dep1:completed");
  });
});

