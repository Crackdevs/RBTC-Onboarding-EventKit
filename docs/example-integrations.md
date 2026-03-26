# Example Integrations

This repo includes two runnable receiver examples.

## Wallet backend example

Verifies webhook signature using:

- `verifyRawBodyHmacSha256Hex`

Stores:

- last lifecycle per deposit
- processed idempotency keys

Receiver:

- `POST /webhooks`

## Exchange processor example

Verifies webhook signature and performs a no-op credit action:

- credits the deposit on `lifecycle === "completed"`
- skips duplicates via idempotency keys

Receiver:

- `POST /webhooks`

