# SDK Usage

The SDK provides:

- `normalizeStatus(status)` -> canonical lifecycle (`detected | pending | confirming | completed | failed`)
- `verifyRawBodyHmacSha256Hex({ rawBody, secret, signatureHex })` -> boolean
- Types: `PegInLifecycle`, `PegInEvent`

## Normalize status

```ts
import { normalizeStatus } from "@rbtc-eventkit/sdk";

const lifecycle = normalizeStatus(rawBackendStatus);
```

## Verify webhook signature (raw body)

Signature verification **must use the raw request body** bytes/string.

```ts
import {
  verifyRawBodyHmacSha256Hex,
} from "@rbtc-eventkit/sdk";

const ok = verifyRawBodyHmacSha256Hex({
  rawBody: reqBodyRawString,
  secret: process.env.WEBHOOK_SECRET!,
  signatureHex: req.headers["x-rbtc-signature"] as string,
});
```

