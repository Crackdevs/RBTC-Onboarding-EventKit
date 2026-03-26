# Quick Start (< 10 min)

This repo contains two published-style packages:

- `@rbtc-eventkit/sdk`: TypeScript SDK (normalization + HMAC signature verification)
- `@rbtc-eventkit/webhook-worker`: Polls the Rootstock backend and delivers **signed webhooks** on lifecycle changes

It also includes runnable example receivers:

- `@rbtc-eventkit/example-wallet-backend`
- `@rbtc-eventkit/example-exchange-processor`

## 1) Install

```bash
npm install
```

## 2) Build SDK + Worker

```bash
npm run build
```

## 3) Start the example receiver (wallet)

```bash
cp examples/wallet-backend/.env.example examples/wallet-backend/.env
npm run dev -w @rbtc-eventkit/example-wallet-backend
```

Receiver endpoint:

- `POST http://localhost:3001/webhooks`

## 4) Start the webhook worker

```bash
cp packages/webhook-worker/.env.example packages/webhook-worker/.env
npm run dev -w @rbtc-eventkit/webhook-worker
```

## 5) How it works (MVP flow)

1. Worker polls the backend (`BACKEND_BASE_URL` + `BACKEND_DEPOSITS_PATH`)
2. It normalizes raw backend statuses to canonical lifecycle states
3. It only emits when the lifecycle changes
4. It signs the JSON payload using HMAC SHA256 over the raw JSON body
5. It delivers to the configured webhook endpoint with required headers

