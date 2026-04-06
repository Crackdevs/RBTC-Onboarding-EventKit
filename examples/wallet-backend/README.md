# Wallet backend example

Sample **integrator** HTTP server: accepts `POST /webhooks` with JSON bodies signed using HMAC-SHA256 (`X-RBTC-Signature`). Verification uses [`@rbtc-eventkit/sdk`](../../packages/sdk).

## Who sends the webhooks?

Not this app. The component that **polls** your backend and **delivers** signed webhooks is [`@rbtc-eventkit/webhook-worker`](../../packages/webhook-worker). See the runnable example:

- [`examples/webhook-worker-runner`](../webhook-worker-runner/README.md) — runs the worker process and points `WEBHOOK_ENDPOINT_URL` at this server’s `/webhooks` (same `WEBHOOK_SECRET`).

## Run

```bash
cp .env.example .env
npm install
npm run dev
```
