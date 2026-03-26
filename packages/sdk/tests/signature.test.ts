import { describe, expect, it } from "vitest";
import {
  signRawBodyHmacSha256Hex,
  verifyRawBodyHmacSha256Hex,
  signWebhookPayloadForTests,
} from "../src/signature.js";

describe("signature helpers", () => {
  it("verifies correct signature", () => {
    const secret = "test-secret";
    const rawBody = JSON.stringify({ hello: "world" });
    const signatureHex = signRawBodyHmacSha256Hex(rawBody, secret);

    expect(
      verifyRawBodyHmacSha256Hex({ rawBody, secret, signatureHex })
    ).toBe(true);
  });

  it("rejects incorrect signature", () => {
    const secret = "test-secret";
    const rawBody = JSON.stringify({ hello: "world" });
    const signatureHex = signRawBodyHmacSha256Hex(rawBody, "wrong-secret");

    expect(
      verifyRawBodyHmacSha256Hex({ rawBody, secret, signatureHex })
    ).toBe(false);
  });

  it("test helper generates matching rawBody+signature", () => {
    const secret = "test-secret";
    const payload = { a: 1, b: "two" };

    const { rawBody, signatureHex } = signWebhookPayloadForTests(payload, secret);
    expect(
      verifyRawBodyHmacSha256Hex({ rawBody, secret, signatureHex })
    ).toBe(true);
  });
});

