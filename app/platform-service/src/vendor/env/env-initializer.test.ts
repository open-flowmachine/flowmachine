import { describe, expect, it } from "bun:test";
import { initEnv } from "./env-initializer";

const VALID_ENV = {
  AUTUMN_SECRET_KEY: "test-autumn-key",
  BETTER_AUTH_SECRET: "test-auth-secret",
  BETTER_AUTH_URL: "http://localhost:8000",
  BETTER_AUTH_TRUSTED_ORIGINS: "http://localhost:3000",
  DAYTONA_API_KEY: "test-daytona-key",
  MONGO_DB_URL: "mongodb://localhost:27017",
  MONGO_DB_NAME: "test-db",
  RESEND_API_KEY: "test-resend-key",
};

describe("initEnv", () => {
  it("should succeed when all required env vars are present", () => {
    const original = { ...process.env };
    Object.assign(process.env, VALID_ENV);

    try {
      expect(() => initEnv()).not.toThrow();
    } finally {
      process.env = original;
    }
  });

  it("should throw when required env vars are missing", () => {
    const original = { ...process.env };
    for (const key of Object.keys(VALID_ENV)) {
      delete process.env[key];
    }

    try {
      expect(() => initEnv()).toThrow();
    } finally {
      process.env = original;
    }
  });
});
