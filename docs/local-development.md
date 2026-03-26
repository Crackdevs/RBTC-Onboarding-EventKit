# Local Development Guide

1. Install dependencies:

```bash
npm install
```

2. Build packages:

```bash
npm run build
```

3. Start a receiver (wallet or exchange):

```bash
cp examples/wallet-backend/.env.example examples/wallet-backend/.env
npm run dev -w @rbtc-eventkit/example-wallet-backend
```

4. Start the worker:

```bash
cp packages/webhook-worker/.env.example packages/webhook-worker/.env
npm run dev -w @rbtc-eventkit/webhook-worker
```

Notes:

- The worker will call the backend URL in `BACKEND_BASE_URL`.
- If the backend shape differs, update `createDefaultBackendAdapter` in `packages/webhook-worker/src/backendAdapter.ts`.

