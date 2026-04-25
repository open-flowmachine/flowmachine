import Elysia from "elysia";
import { serve } from "inngest/bun";

import { aiAgentConversationFunctions } from "@/feature/ai-agent-conversation/ai-agent-conversation-function";
import { workflowFunctions } from "@/feature/workflow/workflow-function";
import { inngestClient } from "@/vendor/inngest/inngest-client";

const inngestRouter = new Elysia({ name: "inngest-router" }).all(
  "/api/inngest",
  ({ request }) =>
    serve({
      client: inngestClient,
      functions: [...workflowFunctions, ...aiAgentConversationFunctions],
    })(request),
);

export { inngestRouter };
