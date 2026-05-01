import type { EngineAction } from "@inngest/workflow-kit";
import type { Inngest } from "inngest";

import { agentRunAction } from "@/feature/workflow/action/workflow-action-agent-run";

const workflowActionDefinitions: EngineAction<Inngest>[] = [
  agentRunAction,
  {
    name: "Code Review Request",
    kind: "code-review-request",
    handler: async (input) => {
      console.log("Executing Code Review Request with input:", input);
    },
  },
];

export { workflowActionDefinitions };
