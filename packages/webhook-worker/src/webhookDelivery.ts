export async function deliverWebhook(opts: {
  endpointUrl: string;
  rawBody: string;
  signatureHex: string;
  eventName: string;
  eventVersion: string;
  timeoutMs?: number;
}): Promise<{ ok: boolean; status: number; statusText: string }> {
  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(opts.endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RBTC-Signature": opts.signatureHex,
        "X-RBTC-Event": opts.eventName,
        "X-RBTC-Event-Version": opts.eventVersion,
      },
      body: opts.rawBody,
      signal: controller.signal,
    });

    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
    };
  } finally {
    clearTimeout(timeout);
  }
}

