import { z } from "zod/v4";

const envSchema = z.object({
  APP_ENV: z.enum(["production", "staging"]).default("staging"),
  APP_VERSION: z.string().default("local"),
  NEXT_PUBLIC_SERVICE_BASE_URL: z.string().default("http://localhost:8000"),
});

const getEnv = () => {
  return envSchema.parse(process.env);
};

export { getEnv };
