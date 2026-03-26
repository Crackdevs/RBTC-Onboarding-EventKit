import type { BackendAdapter } from "./backendAdapter.js";
import { createDefaultBackendAdapter, normalizeBackendStatus } from "./backendAdapter.js";
import type { StateStore } from "./state/types.js";
import { computeExponentialBackoffMs } from "./retry/backoff.js";
import { createLogger } from "./logger.js";
import { getIdempotencyKey } from "./idempotency.js";
import { deliverWebhook } from "./webhookDelivery.js";
import type { PegInEvent, PegInLifecycle } from "@rbtc-eventkit/sdk";
import { signRawBodyHmacSha256Hex } from "@rbtc-eventkit/sdk";

function isProbably2xx(status: number) {
  return status >= 200 && status < 300;
}

export async function startWorker(opts: {
  env: import("./config.js").WorkerEnv;
  store: StateStore;
  backendAdapter?: BackendAdapter;
}) {
  const { env } = opts;
  const logger = createLogger({ logLevel: env.logLevel });

  const backendAdapter =
    opts.backendAdapter ??
    createDefaultBackendAdapter({
      backendBaseUrl: env.backendBaseUrl,
      backendDepositsPath: env.backendDepositsPath,
    });

  async function processRetry(record: import("./state/types.js").RetryRecord) {
    if (await opts.store.hasProcessedIdempotencyKey(record.idempotencyKey)) {
      await opts.store.deleteRetry(record.idempotencyKey);
      return;
    }

    const delivery = await deliverWebhook({
      endpointUrl: env.webhookEndpointUrl,
      rawBody: record.rawBody,
      signatureHex: record.signatureHex,
      eventName: record.eventName,
      eventVersion: record.eventVersion,
    });

    if (isProbably2xx(delivery.status)) {
      await opts.store.markProcessedIdempotencyKey(record.idempotencyKey);
      await opts.store.deleteRetry(record.idempotencyKey);
      logger.info("retry delivered", {
        idempotencyKey: record.idempotencyKey,
        status: delivery.status,
      });
      return;
    }

    const nextAttemptCount = record.attemptCount + 1;
    const maxAttempts = env.retryMaxAttempts;
    if (nextAttemptCount > maxAttempts) {
      await opts.store.deleteRetry(record.idempotencyKey);
      logger.error("retry exhausted", {
        idempotencyKey: record.idempotencyKey,
        status: delivery.status,
        lastError: delivery.statusText,
      });
      return;
    }

    const delayMs = computeExponentialBackoffMs({
      attemptCount: nextAttemptCount,
      baseDelayMs: env.retryBaseDelayMs,
      multiplier: env.retryMultiplier,
    });

    await opts.store.upsertRetry({
      ...record,
      attemptCount: nextAttemptCount,
      nextAttemptAt: Date.now() + delayMs,
      lastError: delivery.statusText,
    });

    logger.warn("retry scheduled", {
      idempotencyKey: record.idempotencyKey,
      nextAttemptCount,
      nextAttemptAt: Date.now() + delayMs,
      status: delivery.status,
    });
  }

  async function processDueRetries() {
    const now = Date.now();
    const due = await opts.store.getDueRetries(now);
    for (const record of due) {
      try {
        await processRetry(record);
      } catch (err) {
        logger.error("retry processing failed", {
          idempotencyKey: record.idempotencyKey,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  async function processDeposit(deposit: import("./backendAdapter.js").BackendDepositStatus) {
    const normalizedLifecycle = normalizeBackendStatus(deposit.sourceStatus);

    const last = await opts.store.getLastLifecycle(deposit.depositId);
    if (last === normalizedLifecycle) {
      return; // no lifecycle transition
    }

    const idempotencyKey = getIdempotencyKey(deposit.depositId, normalizedLifecycle);

    if (await opts.store.hasProcessedIdempotencyKey(idempotencyKey)) {
      // State store might be behind; still make it consistent.
      await opts.store.setLastLifecycle(deposit.depositId, normalizedLifecycle);
      return;
    }

    const payload: PegInEvent = {
      depositId: deposit.depositId,
      btcTxHash: deposit.btcTxHash,
      lifecycle: normalizedLifecycle as PegInLifecycle,
      timestamp: deposit.timestamp ?? Math.floor(Date.now() / 1000),
      sourceStatus: deposit.sourceStatus,
      confirmations: deposit.confirmations,
      idempotencyKey,
      version: 1,
    };

    const rawBody = JSON.stringify(payload);
    const signatureHex = signRawBodyHmacSha256Hex(rawBody, env.webhookSecret);

    const delivery = await deliverWebhook({
      endpointUrl: env.webhookEndpointUrl,
      rawBody,
      signatureHex,
      eventName: env.webhookEventName,
      eventVersion: env.webhookEventVersion,
    });

    // Persist lifecycle transition deterministically even if delivery fails;
    // retries are driven by stored retry metadata.
    await opts.store.setLastLifecycle(deposit.depositId, normalizedLifecycle);

    if (isProbably2xx(delivery.status)) {
      await opts.store.markProcessedIdempotencyKey(idempotencyKey);
      logger.info("webhook delivered", {
        idempotencyKey,
        status: delivery.status,
      });
      return;
    }

    const attemptCount = 1;
    const delayMs = computeExponentialBackoffMs({
      attemptCount,
      baseDelayMs: env.retryBaseDelayMs,
      multiplier: env.retryMultiplier,
    });

    await opts.store.upsertRetry({
      idempotencyKey,
      depositId: deposit.depositId,
      lifecycle: normalizedLifecycle as PegInLifecycle,
      attemptCount,
      nextAttemptAt: Date.now() + delayMs,
      rawBody,
      signatureHex,
      eventName: env.webhookEventName,
      eventVersion: env.webhookEventVersion,
      lastError: delivery.statusText,
    });

    logger.warn("webhook delivery failed; retry scheduled", {
      idempotencyKey,
      status: delivery.status,
      nextAttemptAt: Date.now() + delayMs,
    });
  }

  let tickInFlight = false;
  async function tick() {
    if (tickInFlight) return;
    tickInFlight = true;
    try {
      logger.debug("tick start");
      await processDueRetries();

      const deposits = await backendAdapter.fetchDepositStatuses();
      const results = await Promise.allSettled(
        deposits.map((d) => processDeposit(d))
      );
      const failures = results.filter((r) => r.status === "rejected").length;
      if (failures > 0) logger.warn("tick had deposit failures", { failures });
      logger.debug("tick end");
    } catch (err) {
      logger.error("tick failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      tickInFlight = false;
    }
  }

  await tick();
  setInterval(tick, env.pollIntervalMs);
}

