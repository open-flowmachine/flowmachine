import pino from "pino";

const isProd = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

const level = isTest ? "silent" : isProd ? "info" : "debug";

const baseLog = pino({
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
  ...(!isProd && !isTest
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        },
      }
    : {}),
});

export { baseLog };
