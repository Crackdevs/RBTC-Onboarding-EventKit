import { loadWorkerEnv } from "./config.js";
import { createStateStore } from "./state/createStateStore.js";
import { startWorker } from "./worker.js";

async function main() {
  const env = loadWorkerEnv();

  const store = createStateStore({
    storageMode: env.storageMode,
    storagePath: env.storagePath,
    onError: (msg) => console.error(msg),
  });

  await startWorker({ env, store });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});

