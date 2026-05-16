import Elysia from "elysia";

import { routerUnprotectedSetup } from "@/router/router-plugin";
import { getEnv } from "@/vendor/env/env";

const healthRouter = new Elysia()
  .use(routerUnprotectedSetup)
  .get("/health", () => ({
    status: "ok",
    version: getEnv().APP_VERSION,
    environment: getEnv().APP_ENV,
  }));

export { healthRouter };
