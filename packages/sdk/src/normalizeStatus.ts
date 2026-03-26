import { PegInLifecycle, PegInLifecycleValues } from "./lifecycle.js";

function normalizeRawStatus(status: string): string {
  return status.trim().toLowerCase();
}

/**
 * Normalize a raw backend status into the canonical peg-in lifecycle.
 *
 * Unknown statuses are handled safely by defaulting to `pending`.
 */
export function normalizeStatus(status: string): PegInLifecycle {
  const s = normalizeRawStatus(status);

  // Keep mapping simple & deterministic. Add aliases as the backend evolves.
  switch (s) {
    case "detected":
    case "found":
      return "detected";
    case "pending":
    case "processing":
      return "pending";
    case "confirming":
    case "confirm":
      return "confirming";
    case "completed":
    case "complete":
    case "confirmed_completed":
      return "completed";
    case "failed":
    case "error":
      return "failed";
    default:
      // Safety default per requirements.
      return "pending";
  }
}

export function isPegInLifecycle(value: unknown): value is PegInLifecycle {
  return typeof value === "string" && (PegInLifecycleValues as readonly string[]).includes(value);
}

