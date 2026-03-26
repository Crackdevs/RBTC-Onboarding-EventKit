import type { PegInLifecycle } from "./lifecycle.js";

export interface PegInEvent {
  depositId: string;
  btcTxHash: string;
  lifecycle: PegInLifecycle;
  timestamp: number;

  // Optional but recommended fields.
  sourceStatus?: string;
  confirmations?: number;
  idempotencyKey?: string;
  version?: number;
}

