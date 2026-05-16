import Elysia from "elysia";
import { serve } from "inngest/bun";

import { aiAgentSessionFunctions } from "@/feature/workflow/ai-agent-session/ai-agent-session-function";
import { workflowFunctions } from "@/feature/workflow/workflow-function";
import { routerUnprotectedSetup } from "@/router/router-plugin";
import { inngestClient } from "@/vendor/inngest/inngest-client";

const inngestRouter = new Elysia({ name: "inngest-router" })
  .use(routerUnprotectedSetup)
  .all("/api/inngest", ({ request }) =>
    serve({
      client: inngestClient,
      functions: [...workflowFunctions, ...aiAgentSessionFunctions],
    })(request),
  );

export { inngestRouter };
