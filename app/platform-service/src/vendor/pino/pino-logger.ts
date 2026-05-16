import pino from "pino";

import { getEnv } from "@/vendor/env/env";

type Logger = pino.Logger;

const isProd = getEnv().NODE_ENV === "production";
const isTest = getEnv().NODE_ENV === "test";

const level = isTest ? "silent" : isProd ? "info" : "debug";

const baseLogger = pino({
  level,
  base: { service: "platform-service" },
  redact: {
    paths: [
      "password",
      "token",
      "apiKey",
      "secret",
      "authorization",
      "cookie",
      "credential",
      "credentials.*",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
});

export { baseLogger };
export type { Logger };
