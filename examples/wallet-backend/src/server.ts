import express from "express";
import dotenv from "dotenv";
import type { PegInLifecycle } from "@rbtc-eventkit/sdk";
import {
  isPegInLifecycle,
  verifyRawBodyHmacSha256Hex,
} from "@rbtc-eventkit/sdk";
import { createWalletStateStore } from "./store.js";

dotenv.config();

const port = Number(process.env.PORT ?? "3001");
const webhookSecret = process.env.WEBHOOK_SECRET;
const storagePath = process.env.STORAGE_PATH ?? "./data/wallet-backend.json";

if (!webhookSecret) {
  throw new Error("Missing WEBHOOK_SECRET");
}

const store = createWalletStateStore({ storagePath });

const app = express();

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post(
  "/webhooks",
  // Use raw body so signature verification uses the original bytes.
  express.raw({ type: "application/json" }),
  (req, res) => {
    try {
      const rawBody =
        typeof req.body === "string"
          ? req.body
          : (req.body as Buffer).toString("utf8");

      const signatureHex = String(req.get("X-RBTC-Signature") ?? "");
      if (!signatureHex) {
        res.status(400).json({ error: "Missing X-RBTC-Signature" });
        return;
      }

      const valid = verifyRawBodyHmacSha256Hex({
        rawBody,
        secret: webhookSecret,
        signatureHex,
      });

      if (!valid) {
        res.status(401).json({ error: "Invalid signature" });
        return;
      }

      const payload: any = JSON.parse(rawBody);
      const depositId = payload?.depositId;
      const btcTxHash = payload?.btcTxHash;
      const lifecycle = payload?.lifecycle as PegInLifecycle;
      const timestamp = payload?.timestamp;

      if (typeof depositId !== "string" || typeof btcTxHash !== "string") {
        res.status(400).json({ error: "Invalid payload" });
        return;
      }
      if (!isPegInLifecycle(lifecycle)) {
        res.status(400).json({ error: "Invalid lifecycle" });
        return;
      }
      if (typeof timestamp !== "number") {
        res.status(400).json({ error: "Invalid timestamp" });
        return;
      }

      const idempotencyKey =
        typeof payload?.idempotencyKey === "string"
          ? payload.idempotencyKey
          : `${depositId}:${lifecycle}`;

      if (store.hasProcessed(idempotencyKey)) {
        res.status(200).json({ ok: true, duplicate: true });
        return;
      }

      store.setDepositLifecycle(depositId, lifecycle);
      store.markProcessed(idempotencyKey);

      // In a real wallet backend, this is where you'd update deposit records,
      // notify users, etc. For the example we just persist state.
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`wallet-backend listening on :${port}`);
});

