import Elysia from "elysia";
import { getEnv } from "@/vendor/env/env";

const healthRouter = new Elysia().get("/health", () => ({
  status: "ok",
  version: getEnv().APP_VERSION,
  environment: getEnv().APP_ENV,
}));

export { healthRouter };
