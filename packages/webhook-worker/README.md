# @rbtc-eventkit/webhook-worker

Self-hostable **Rootstock Protocol Observer** worker: it polls a configurable backend adapter, normalizes peg-in state into canonical lifecycle values, and delivers **signed webhooks** to an integrator endpoint.

## Adapters

| Mode | Purpose |
| ---- | ------- |
| **`twoWp`** | Production-oriented integration with **[rsksmart/2wp-api](https://github.com/rsksmart/2wp-api)** (`GET /tx-history`, `GET /tx-status/{txId}`). Contract version is pinned in-repo: [`docs/two-wp-api.md`](../../docs/two-wp-api.md). |
| **`generic`** | Loose JSON (`[]` or `{ "deposits": [] }`) for **local / mock** backends and custom gateways. This is **not** a substitute for observing official 2WP in production. |

**Mainnet vs testnet** is determined solely by which **2wp-api base URL** you configure (operator-chosen deployment).

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

- `BACKEND_ADAPTER` — `generic` (default) or `twoWp` (aliases: `two_wp`, `2wp`)
- **Generic:** `BACKEND_BASE_URL`, `BACKEND_DEPOSITS_PATH`
- **TwoWp:** `TWO_WP_TRACKED_ADDRESS` (required); `TWO_WP_BASE_URL` optional if `BACKEND_BASE_URL` already points at 2wp-api; optional `TWO_WP_HISTORY_PAGE`, `TWO_WP_STATUS_CONCURRENCY`
- `POLL_INTERVAL_MS`
- `WEBHOOK_ENDPOINT_URL`
- `WEBHOOK_SECRET`
- `STORAGE_MODE` and `STORAGE_PATH`

A **local mock peg-in HTTP server** (for example a small Express app that returns `{ "deposits": [...] }`) should use `BACKEND_ADAPTER=generic`. Treat it as **non-production** integration testing only.

## Run

```bash
npm run dev
```

## Webhook headers

- `X-RBTC-Signature` (HMAC SHA256 hex of raw JSON body)
- `X-RBTC-Event`
- `X-RBTC-Event-Version`

