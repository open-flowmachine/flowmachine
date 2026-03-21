import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  APP_ENV: z.string().default("local"),
  APP_VERSION: z.string().default("0.0.0"),

  AUTUMN_SECRET_KEY: z.string(),

  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string(),

  DAYTONA_API_KEY: z.string(),

  MONGO_DB_URL: z.string(),
  MONGO_DB_NAME: z.string(),

  RESEND_API_KEY: z.string(),
  RESEND_FROM_ADDRESS: z
    .string()
    .default("Flow Machine <root@email.flowmachine.io>"),
});

const getEnv = () => {
  return envSchema.parse(process.env);
};

export { getEnv };
