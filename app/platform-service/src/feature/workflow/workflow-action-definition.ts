import type { EngineAction } from "@inngest/workflow-kit";
import type { Inngest } from "inngest";

import { agenticLoopAction } from "@/feature/workflow/action/workflow-action-agentic-loop";

const workflowActionDefinitions: EngineAction<Inngest>[] = [
  agenticLoopAction,
  {
    name: "Code Review Request",
    kind: "code-review-request",
    handler: async (input) => {
      console.log("Executing Code Review Request with input:", input);
    },
  },
];

export { workflowActionDefinitions };
