import type { WorkerEnv } from "./config.js";
import type { BackendAdapter } from "./backendAdapter.js";
import { createDefaultBackendAdapter } from "./backendAdapter.js";
import { createTwoWpBackendAdapter } from "./twoWp/twoWpAdapter.js";

export function createBackendAdapter(env: WorkerEnv): BackendAdapter {
  if (env.backendAdapter === "twoWp") {
    return createTwoWpBackendAdapter({
      baseUrl: env.twoWpBaseUrl ?? env.backendBaseUrl,
      trackedAddress: env.twoWpTrackedAddress,
      historyPage: env.twoWpHistoryPage,
      statusConcurrency: env.twoWpStatusConcurrency,
    });
  }

  return createDefaultBackendAdapter({
    backendBaseUrl: env.backendBaseUrl,
    backendDepositsPath: env.backendDepositsPath,
  });
}
