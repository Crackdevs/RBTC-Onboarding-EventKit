# Project Overview

`RBTC Onboarding EventKit` standardizes BTC → RBTC peg-in lifecycle events.

Architecture (MVP):

1. Webhook worker polls the Rootstock backend (`BACKEND_BASE_URL` + `BACKEND_DEPOSITS_PATH`)
2. Worker normalizes backend statuses to canonical lifecycle states
3. Worker detects lifecycle transitions (state change detection)
4. Worker signs JSON payloads using **HMAC SHA256 over the raw JSON body**
5. Worker delivers webhooks with stable headers
6. Integrators verify signatures using the SDK and update their systems

Canonical lifecycle states:

- `detected`
- `pending`
- `confirming`
- `completed`
- `failed`

