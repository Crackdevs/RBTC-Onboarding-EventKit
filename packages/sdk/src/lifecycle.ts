export const PegInLifecycleValues = [
  "detected",
  "pending",
  "confirming",
  "completed",
  "failed",
] as const;

export type PegInLifecycle = (typeof PegInLifecycleValues)[number];

