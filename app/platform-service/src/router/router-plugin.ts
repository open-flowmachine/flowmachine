import Elysia from "elysia";

import { routerAuthGuard } from "@/router/router-auth-guard";
import { routerErrorHandler } from "@/router/router-error-handler";
import { routerLoggerSetup } from "@/router/router-logger-setup";
import { routerRequestIdSetup } from "@/router/router-request-id-setup";

const routerProtectedSetup = (app: Elysia) =>
  app
    .use(routerRequestIdSetup)
    .use(routerLoggerSetup)
    .use(routerAuthGuard)
    .use(routerErrorHandler);

const routerUnprotectedSetup = (app: Elysia) =>
  app.use(routerRequestIdSetup).use(routerLoggerSetup).use(routerErrorHandler);

export { routerProtectedSetup, routerUnprotectedSetup };
