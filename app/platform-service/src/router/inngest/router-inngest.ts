import Elysia from "elysia";
import { serve } from "inngest/bun";
import { workflowFunctions } from "@/feature/workflow/workflow-function";
import { inngestClient } from "@/vendor/inngest/inngest-client";

const inngestRouter = new Elysia({ name: "inngest-router" }).all(
  "/api/inngest",
  ({ request }) =>
    serve({
      client: inngestClient,
      functions: [...workflowFunctions],
    })(request),
);

export { inngestRouter };
