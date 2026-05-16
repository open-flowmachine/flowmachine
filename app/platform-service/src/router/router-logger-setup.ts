import Elysia from "elysia";

import { baseLogger } from "@/vendor/pino/pino-logger";

const routerLoggerSetup = (
  app: Elysia<
    "",
    {
      decorator: {};
      derive: { requestId: string };
      resolve: {};
      store: {};
    }
  >,
) =>
  app.derive(({ requestId }) => {
    const logger = baseLogger.child({ inboundType: "http", requestId });
    return { logger } as const;
  });

export { routerLoggerSetup };
