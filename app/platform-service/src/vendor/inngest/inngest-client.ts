import { Inngest, InngestMiddleware } from "inngest";

import { makeInngestLog } from "@/vendor/pino/pino-log-inngest";

const loggerMiddleware = new InngestMiddleware({
  name: "logger",
  init: () => ({
    onFunctionRun: ({ ctx }) => {
      const baseScopeLog = makeInngestLog({
        runId: ctx.runId,
        eventName: ctx.event.name,
        attempt: 0,
      });

      return {
        transformInput: ({ ctx: inputCtx }) => {
          const log = baseScopeLog.child({
            attempt: (inputCtx as { attempt?: number }).attempt ?? 0,
          });
          return { ctx: { log } };
        },
        transformOutput: ({ result }) => {
          if (result.error !== undefined) {
            baseScopeLog.error(
              { err: result.error },
              "inngest function failed",
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
