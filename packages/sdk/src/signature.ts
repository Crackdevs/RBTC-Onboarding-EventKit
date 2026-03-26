import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Generate HMAC-SHA256 signature for a raw JSON request body.
 *
 * IMPORTANT: Verification must use the raw request body bytes/string, not a
 * re-serialized object. This function therefore takes `rawBody` as a string.
 */
export function signRawBodyHmacSha256Hex(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

export function verifyRawBodyHmacSha256Hex(opts: {
  rawBody: string;
  secret: string;
  signatureHex: string;
}): boolean {
  const expected = signRawBodyHmacSha256Hex(opts.rawBody, opts.secret);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(opts.signatureHex, "utf8");

  // Use timingSafeEqual to avoid leaking whether prefix/suffix matches.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Test helper: create a raw JSON body and its signature.
 * Note: `JSON.stringify` key order is insertion-order dependent; keep object
 * construction deterministic in tests/fixtures.
 */
export function signWebhookPayloadForTests(payload: unknown, secret: string): {
  rawBody: string;
  signatureHex: string;
} {
  const rawBody = JSON.stringify(payload);
  const signatureHex = signRawBodyHmacSha256Hex(rawBody, secret);
  return { rawBody, signatureHex };
}

