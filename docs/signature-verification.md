# Signature Verification Guide

Receivers must verify:

1. Read the **raw request body** (do not parse + reserialize)
2. Extract `X-RBTC-Signature`
3. Recompute HMAC SHA256 over the raw body using the shared secret
4. Compare in constant time

Example:

```ts
import { verifyRawBodyHmacSha256Hex } from "@rbtc-eventkit/sdk";

const ok = verifyRawBodyHmacSha256Hex({
  rawBody: reqBodyRawString,
  secret: process.env.WEBHOOK_SECRET!,
  signatureHex: req.get("X-RBTC-Signature")!,
});
```

If verification fails, return `401`.

