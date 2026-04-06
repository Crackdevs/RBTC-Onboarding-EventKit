# @rbtc-eventkit/webhook-worker

Self-hostable worker that polls a peg-in status backend, normalizes statuses into canonical lifecycle states, and delivers **signed webhooks** to an integrator endpoint.

## Install

```bash
npm install @rbtc-eventkit/webhook-worker
```

## Configure

Copy the env template:

```bash
cp .env.example .env
```

Key variables:

- `BACKEND_BASE_URL`, `BACKEND_DEPOSITS_PATH`
- `POLL_INTERVAL_MS`
- `WEBHOOK_ENDPOINT_URL`
- `WEBHOOK_SECRET`
- `STORAGE_MODE` and `STORAGE_PATH`

## Run

```bash
npm run dev
```

## Webhook headers

- `X-RBTC-Signature` (HMAC SHA256 hex of raw JSON body)
- `X-RBTC-Event`
- `X-RBTC-Event-Version`

