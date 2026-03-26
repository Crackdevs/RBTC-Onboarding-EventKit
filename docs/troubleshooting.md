# Troubleshooting

## Worker can’t deliver webhooks

- Check `WEBHOOK_ENDPOINT_URL` in `packages/webhook-worker/.env`
- Ensure the receiver is running and listening on the expected port
- If you see retries in logs:
  - receiver returned non-2xx
  - or signature verification failed (see next section)

## Signature verification fails (401)

Most common causes:

- Receiver is not using the raw request body
- Receiver uses the wrong `WEBHOOK_SECRET`
- Receiver is reading a reserialized JSON object instead of raw bytes

Receivers should use `express.raw({ type: "application/json" })`
or an equivalent raw-body parser.

