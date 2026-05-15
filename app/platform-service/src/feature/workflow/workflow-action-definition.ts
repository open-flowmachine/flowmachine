import type { EngineAction } from "@inngest/workflow-kit";
import type { Inngest } from "inngest";
import type { Logger } from "pino";

const workflowActionDefinitions: EngineAction<Inngest>[] = [
  {
    name: "Code Review Request",
    kind: "code-review-request",
    handler: async (input) => {
      const log = (input as { log?: Logger }).log;
      log?.info({ kind: "code-review-request" }, "executing action");
    },
  },
];

export { workflowActionDefinitions };
