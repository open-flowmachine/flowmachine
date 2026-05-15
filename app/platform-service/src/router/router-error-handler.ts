import Elysia from "elysia";

import { Err } from "@/shared/err/err";
import { errEnvelope } from "@/shared/http/http-envelope";
import { baseLog } from "@/vendor/pino/pino-log";

const MODULE_NAME = "router-error-handler";

const fallbackLog = baseLog.child({ module: MODULE_NAME });

const routerErrorHandler = new Elysia({ name: MODULE_NAME }).onError(
  { as: "global" },
  (ctx) => {
    const { error, code, request } = ctx;
    const log = (ctx as { log?: typeof fallbackLog }).log ?? fallbackLog;

    log.error(
      { err: error, path: new URL(request.url).pathname },
      "request failed",
    );

    if (code === "VALIDATION") {
      const domainErr = Err.code("unprocessableEntity", { cause: error });
      return errEnvelope(domainErr);
    }

    const domainErr = Err.from(error);
    return errEnvelope(domainErr);
  },
);

export { routerErrorHandler };
