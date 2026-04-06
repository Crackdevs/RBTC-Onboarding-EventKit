# Exchange processor example

Sample integrator server: `POST /webhooks` with payloads verified using [`@rbtc-eventkit/sdk`](../../packages/sdk).

To exercise the full pipeline (poll → signed webhook → this server), run [`@rbtc-eventkit/webhook-worker`](../../packages/webhook-worker) via [`examples/webhook-worker-runner`](../webhook-worker-runner/README.md) and set `WEBHOOK_ENDPOINT_URL` to this app’s `/webhooks` (and match `WEBHOOK_SECRET`).

```bash
cp .env.example .env
npm install
npm run dev
```
