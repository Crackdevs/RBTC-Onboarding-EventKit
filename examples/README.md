# Examples

| Example | Role |
|--------|------|
| [`wallet-backend`](./wallet-backend/) | Receives signed webhooks; verifies with `@rbtc-eventkit/sdk`. |
| [`exchange-processor`](./exchange-processor/) | Same pattern as wallet-backend for a different sample flow. |
| [`webhook-worker-runner`](./webhook-worker-runner/) | Runs **`@rbtc-eventkit/webhook-worker`** (poll → deliver webhooks). Pair with `wallet-backend` or `exchange-processor` as the `WEBHOOK_ENDPOINT_URL`. |

Flow: **webhook-worker** → POST signed JSON → **wallet-backend** / **exchange-processor** (SDK verification).
