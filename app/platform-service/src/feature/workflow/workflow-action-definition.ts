import type { EngineAction } from "@inngest/workflow-kit";
import type { Inngest } from "inngest";

const workflowActionDefinitions: EngineAction<Inngest>[] = [
  {
    name: "Agentic Loop",
    kind: "agenticLoop",
    handler: async (input) => {
      console.log("Executing Agentic Loop with input:", input);
    },
  },
  {
    name: "Code Review Request",
    kind: "codeReviewRequest",
    handler: async (input) => {
      console.log("Executing Code Review Request with input:", input);
    },
  },
];

export { workflowActionDefinitions };
