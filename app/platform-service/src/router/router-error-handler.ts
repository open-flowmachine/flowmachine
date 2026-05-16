import Elysia from "elysia";

import { Err } from "@/shared/err/err";
import { errEnvelope } from "@/shared/http/http-envelope";
import { baseLogger, type Logger } from "@/vendor/pino/pino-logger";

const MODULE_NAME = "router-error-handler";

const fallbackLogger = baseLogger.child({ module: MODULE_NAME });

const routerErrorHandler = (
  app: Elysia<
    "",
    {
      decorator: {};
      derive: { logger: Logger };
      resolve: {};
      store: {};
    }
  >,
) =>
  app.onError(({ error, code, logger: defaultLogger }) => {
    let err = null;
    const logger = defaultLogger ?? fallbackLogger;

    switch (code) {
      case "VALIDATION":
        err = Err.code("unprocessableEntity", { cause: error });
        break;
      default:
        err = Err.from(error);
    }

    logger.error({ error }, "Request failed");
    return errEnvelope(err);
  });

export { routerErrorHandler };
