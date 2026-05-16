import { Inngest, InngestMiddleware } from "inngest";

import { baseLogger } from "@/vendor/pino/pino-logger";

const loggerMiddleware = new InngestMiddleware({
  name: "logger",
  init: () => ({
    onFunctionRun: ({ ctx }) => {
      const baseInngestLogger = baseLogger.child({
        inboundType: "inngest",
        runId: ctx.runId,
        eventName: ctx.event.name,
      });

      return {
        transformInput: ({ ctx }) => ({
          ctx: { logger: baseInngestLogger.child({ attempt: ctx.attempt }) },
        }),
        transformOutput: ({ result }) => {
          if (result.error !== undefined) {
            baseInngestLogger.error(
              { error: result.error },
              "Inngest function failed",
            );
          }
        },
      };
    },
  }),
});

const inngestClient = new Inngest({
  id: "flowmachine",
  middleware: [loggerMiddleware],
});

export { inngestClient };
