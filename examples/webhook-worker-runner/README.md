# Webhook worker example

This folder is the **usage example** for [`@rbtc-eventkit/webhook-worker`](../../packages/webhook-worker): a long-running process that polls your peg-in backend and POSTs **signed** JSON webhooks to an integrator URL.

It is **not** imported into Express like [`@rbtc-eventkit/sdk`](../../packages/sdk). You run it as a separate Node process.

## Prereqs

1. Build the worker package once (produces `dist/`):

   ```bash
   cd ../../packages/webhook-worker && npm install && npm run build
   ```

2. Install this example:

   ```bash
   cd examples/webhook-worker-runner
   npm install
   ```

3. Copy env and edit values (especially `BACKEND_BASE_URL`, `WEBHOOK_ENDPOINT_URL`, `WEBHOOK_SECRET`):

   ```bash
   cp .env.example .env
   ```

## Pair with `wallet-backend`

1. Start the sample receiver (verifies `X-RBTC-Signature` with the SDK):

   ```bash
   cd ../wallet-backend
   npm install && npm run dev
   ```

2. In `webhook-worker-runner/.env`, set:

   - `WEBHOOK_ENDPOINT_URL=http://localhost:3001/webhooks`
   - `WEBHOOK_SECRET` to the **same** value as `wallet-backend`’s `WEBHOOK_SECRET`

3. Point `BACKEND_BASE_URL` / `BACKEND_DEPOSITS_PATH` at an API that implements the worker’s expected deposit listing (see the worker package README).

4. Start the worker:

   ```bash
   cd ../webhook-worker-runner
   npm start
   ```

## Run from npm (outside this repo)

After publishing, you can depend on `@rbtc-eventkit/webhook-worker` from the registry and use the same `npm start` pattern with `node_modules/@rbtc-eventkit/webhook-worker/dist/index.js`.
