# 2wp-api integration contract (pinned)

This document pins the **rsksmart/2wp-api** version the EventKit **TwoWp** worker adapter targets and lists the **read** HTTP paths used in Milestone 1.

| Field | Value |
| ----- | ----- |
| **Repository** | [rsksmart/2wp-api](https://github.com/rsksmart/2wp-api) |
| **Pinned release** | **v3.3.1** (tag `v3.3.1`) |
| **OpenAPI** | Generated in upstream via `npm run openapi-spec` (LoopBack; upstream commonly expects **Node 20**). This repo does not vendor the generated file; use the tag above when regenerating locally. |

## Endpoints used by `@rbtc-eventkit/webhook-worker` (TwoWp adapter)

### 1. `GET /tx-history`

**Query**

| Parameter | Required | Description |
| --------- | -------- | ----------- |
| `address` | yes | RSK `0x…` or BTC address (per upstream model validation). |
| `page` | no | Page number, default `1` (must be ≥ 1). |

**Response (200)** — paginated envelope:

```json
{
  "data": [ /* TxHistory */ ],
  "total": 0,
  "page": 1,
  "totalPages": 0
}
```

**TxHistory** (subset relevant to the worker): `txHash`, `userAddress`, `providerHash`, `date`, and other metadata. See upstream [`src/models/tx-history.model.ts`](https://github.com/rsksmart/2wp-api/blob/v3.3.1/src/models/tx-history.model.ts).

### 2. `GET /tx-status/{txId}`

**Path**

- `txId`: 64-char hex **with or without** `0x` prefix (upstream validates pattern).

**Response (200)** — `TxStatus` JSON:

- `type`: e.g. `PEGIN`, `PEGOUT`, `FLYOVER_PEGIN`, `FLYOVER_PEGOUT`, `INVALID_DATA`, `UNEXPECTED_ERROR`, `BLOCKBOOK_FAILED`.
- `txDetails`: present when a concrete protocol record was found; for native peg-in, this is **`PeginStatus`** (BTC + RSK legs and aggregate `status`).

See upstream [`src/controllers/tx-status.controller.ts`](https://github.com/rsksmart/2wp-api/blob/v3.3.1/src/controllers/tx-status.controller.ts) and [`src/models/tx-status.model.ts`](https://github.com/rsksmart/2wp-api/blob/v3.3.1/src/models/tx-status.model.ts).

### 3. Optional: `GET /tx-status-by-type/{txId}/{txType}`

Available on the same controller; the Milestone 1 adapter uses **`GET /tx-status/{txId}`** only (upstream tries native peg-in among other types automatically).

## Peg-in status model (mapping reference)

Native **`PeginStatus.status`** string enum (upstream [`src/models/pegin-status.model.ts`](https://github.com/rsksmart/2wp-api/blob/v3.3.1/src/models/pegin-status.model.ts)):

- `NOT_IN_BTC_YET`
- `WAITING_CONFIRMATIONS`
- `NOT_IN_RSK_YET`
- `CONFIRMED`
- `REJECTED_NO_REFUND`
- `REJECTED_REFUND`
- `ERROR_NOT_A_PEGIN`
- `ERROR_BELOW_MIN`
- `ERROR_UNEXPECTED`

**Flyover** peg-in details use `FlyoverStatuses`: `PENDING`, `COMPLETED` (see [`src/models/flyover-status.model.ts`](https://github.com/rsksmart/2wp-api/blob/v3.3.1/src/models/flyover-status.model.ts)).

The worker maps these to internal `sourceStatus` strings consumed by `normalizeStatus()` (see `packages/webhook-worker/src/twoWp/mapTwoWpToDepositRow.ts`).

## Network / base URL

Operators choose **mainnet vs testnet** (or other deployments) by setting the **base URL** of their 2wp-api instance—e.g. `TWO_WP_BASE_URL` or `BACKEND_BASE_URL` when `BACKEND_ADAPTER=twoWp`. Exact public hostnames are deployment-specific; the **path contract** is defined by this pinned tag.
