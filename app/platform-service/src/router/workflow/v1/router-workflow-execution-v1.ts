import Elysia from "elysia";

import { WORKFLOW_EXECUTION_TRIGGERED_EVENT } from "@/feature/workflow/workflow-constant";
import { postWorkflowExecutionRequestBodyDtoSchema } from "@/router/workflow/v1/router-workflow-execution-v1-dto";
import { okEnvelope } from "@/shared/http/http-envelope";
import { inngestClient } from "@/vendor/inngest/inngest-client";

const workflowExecutionV1Router = new Elysia({
  name: "workflowExecutionV1HttpRouter",
}).group("/api/v1/workflow-execution", (r) =>
  r.post(
    "",
    async ({ body }) => {
      await inngestClient.send({
        name: WORKFLOW_EXECUTION_TRIGGERED_EVENT,
        data: {
          tenant: body.tenant,
          workflowDefinitionId: body.workflowDefinitionId,
        },
      });
      return okEnvelope();
    },
    {
      body: postWorkflowExecutionRequestBodyDtoSchema,
    },
  ),
);

export { workflowExecutionV1Router };
