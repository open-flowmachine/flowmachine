import { z } from "zod/v4";

const configSchema = z.object({
  app: z.object({
    env: z.enum(["production", "staging"]).default("staging"),
    version: z.string().default("local"),
  }),

  service: z.object({
    baseUrl: z.string().default("http://localhost:8000"),
  }),
});

export const config = configSchema.parse({
  app: {
    env: process.env.APP_ENV,
    version: process.env.APP_VERSION,
  },

  service: {
    baseUrl: process.env.NEXT_PUBLIC_SERVICE_BASE_URL,
  },
});
