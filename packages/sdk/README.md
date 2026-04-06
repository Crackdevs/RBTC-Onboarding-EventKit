# @rbtc-eventkit/sdk

TypeScript SDK for RBTC Onboarding EventKit.

## Install

```bash
npm install @rbtc-eventkit/sdk
```

## What’s included

- **Lifecycle normalization**: `normalizeStatus(status)` → canonical lifecycle
- **Webhook signing/verification**: HMAC SHA256 over the **raw JSON body**
- **Types**: `PegInLifecycle`, `PegInEvent`

## Usage

```ts
import {
  normalizeStatus,
  verifyRawBodyHmacSha256Hex,
  type PegInEvent,
} from "@rbtc-eventkit/sdk";

const lifecycle = normalizeStatus("confirmed_completed");

const ok = verifyRawBodyHmacSha256Hex({
  rawBody: rawJsonBodyString,
  secret: process.env.WEBHOOK_SECRET!,
  signatureHex: req.get("X-RBTC-Signature")!,
});
```

## Docs

See `docs/` in the repo for:

- webhook contract
- signature verification guide
- examples

