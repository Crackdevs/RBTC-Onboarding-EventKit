import type { LogLevel } from "./config.js";

function levelRank(level: LogLevel): number {
  switch (level) {
    case "debug":
      return 10;
    case "info":
      return 20;
    case "warn":
      return 30;
    case "error":
      return 40;
    default:
      return 0;
  }
}

export function createLogger(opts: { logLevel: LogLevel }) {
  const min = levelRank(opts.logLevel);
  const log = (level: LogLevel, message: string, meta?: unknown) => {
    if (levelRank(level) < min) return;
    const line = {
      time: new Date().toISOString(),
      level,
      message,
      ...(meta ? { meta } : {}),
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(line));
  };

  return {
    debug: (message: string, meta?: unknown) => log("debug", message, meta),
    info: (message: string, meta?: unknown) => log("info", message, meta),
    warn: (message: string, meta?: unknown) => log("warn", message, meta),
    error: (message: string, meta?: unknown) => log("error", message, meta),
  };
}

