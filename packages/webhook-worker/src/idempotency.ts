import type { PegInLifecycle } from "@rbtc-eventkit/sdk";

export function getIdempotencyKey(depositId: string, lifecycle: PegInLifecycle) {
  return `${depositId}:${lifecycle}`;
}

