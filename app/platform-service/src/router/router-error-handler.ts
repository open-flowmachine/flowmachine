import Elysia from "elysia";
import { Err } from "@/shared/err/err";
import { errEnvelope } from "@/shared/http/http-envelope";
import { baseLog } from "@/vendor/pino/pino-log";

const MODULE_NAME = "router-error-handler";

const log = baseLog.child({ module: MODULE_NAME });

const routerErrorHandler = new Elysia({ name: MODULE_NAME }).onError(
  { as: "global" },
  ({ error, code }) => {
    log.error({ error });

    if (code === "VALIDATION") {
      const domainErr = Err.code("unprocessableEntity", { cause: error });
      return errEnvelope(domainErr);
    }

    const domainErr = Err.from(error);
    return errEnvelope(domainErr);
  },
);

export { routerErrorHandler };
