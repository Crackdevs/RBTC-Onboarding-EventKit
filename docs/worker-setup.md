# Worker Setup

## Required configuration

Copy the env template:

```bash
cp packages/webhook-worker/.env.example packages/webhook-worker/.env
```

Key variables:

- `BACKEND_BASE_URL` and `BACKEND_DEPOSITS_PATH`
- `POLL_INTERVAL_MS`
- `WEBHOOK_ENDPOINT_URL`
- `WEBHOOK_SECRET`
- `STORAGE_MODE` (`sqlite` recommended) and `STORAGE_PATH`
- `RETRY_MAX_ATTEMPTS` (exponential backoff)

## Run

```bash
npm run dev -w @rbtc-eventkit/webhook-worker
```

The worker will:

- poll backend statuses
- normalize statuses to canonical lifecycle values
- detect lifecycle transitions by comparing with persisted state
- sign and deliver webhooks
- retry failed deliveries with exponential backoff

