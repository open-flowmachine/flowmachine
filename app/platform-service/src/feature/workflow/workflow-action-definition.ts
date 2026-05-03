import type { EngineAction } from "@inngest/workflow-kit";
import type { Inngest } from "inngest";

const workflowActionDefinitions: EngineAction<Inngest>[] = [
  {
    name: "Code Review Request",
    kind: "code-review-request",
    handler: async (input) => {
      console.log("Executing Code Review Request with input:", input);
    },
  },
];

export { workflowActionDefinitions };
