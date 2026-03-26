# Webhook Contract

Outgoing webhooks are HTTP `POST` requests with a JSON body.

## Headers

- `Content-Type: application/json`
- `X-RBTC-Signature`: HMAC SHA256 (hex) of the **raw JSON body**
- `X-RBTC-Event`: event name (`WEBHOOK_EVENT_NAME`)
- `X-RBTC-Event-Version`: version string (`WEBHOOK_EVENT_VERSION`)

## Payload

Minimal fields:

- `depositId: string`
- `btcTxHash: string`
- `lifecycle: "detected" | "pending" | "confirming" | "completed" | "failed"`
- `timestamp: number`

Recommended additional fields:

- `sourceStatus?: string`
- `confirmations?: number`
- `idempotencyKey?: string` (recommended format: `depositId:lifecycle`)
- `version?: number`

