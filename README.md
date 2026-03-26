# RBTC Onboarding EventKit

Developer-focused toolkit to standardize BTC → RBTC peg-in lifecycle events and deliver **signed webhooks** to integrators.

## What’s in this repo

- `packages/sdk`: TypeScript SDK (lifecycle normalization, webhook signing/verification, types)
- `packages/webhook-worker`: Self-hostable worker (poll → normalize → dedupe → sign → deliver)
- `examples/wallet-backend`: Example receiver (verify signature, update deposit status)
- `examples/exchange-processor`: Example receiver (verify + idempotency + credit on `completed`)
- `docs`: Quick start and references

## Quick start (local)

1) Install deps (repo root):

```bash
npm install
```

2) Build packages:

```bash
npm run build
```

3) Run the worker:

```bash
cp packages/webhook-worker/.env.example packages/webhook-worker/.env
npm run dev -w @rbtc-eventkit/webhook-worker
```

4) Run an example receiver (in a second terminal):

```bash
cp examples/wallet-backend/.env.example examples/wallet-backend/.env
npm run dev -w @rbtc-eventkit/example-wallet-backend
```

See `docs/quickstart.md` for full setup and payload/header details.

