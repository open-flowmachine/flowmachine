import Elysia from "elysia";
import { WORKFLOW_EXECUTION_TRIGGERED_EVENT } from "@/feature/workflow/workflow-constant";
import { makeProjectService } from "@/module/project/project-service";
import { makeWorkflowDefinitionService } from "@/module/workflow/workflow-definition-service";
import { webhookJiraQueryDtoSchema } from "@/router/webhook/v1/router-webhook-v1-dto";
import { decodeBase62 } from "@/shared/encoding/encoding-base62";
import { Err } from "@/shared/err/err";
import { okEnvelope } from "@/shared/http/http-envelope";
import { tenantSchema } from "@/shared/model/model-tenant";
import { validate } from "@/shared/schema/schema-validation";
import { inngestClient } from "@/vendor/inngest/inngest-client";

const projectService = makeProjectService();
const workflowDefinitionService = makeWorkflowDefinitionService();

const webhookV1Router = new Elysia({ name: "webhookV1Router" }).group(
  "/api/v1/webhook",
  (r) =>
    r.post(
      "/jira",
      async ({ query }) => {
        const decoded = decodeBase62(query.tenant);

        let tenantJson: unknown;
        try {
          tenantJson = JSON.parse(decoded);
        } catch {
          throw Err.code("badRequest", { message: "Invalid tenant encoding" });
        }

        const tenantResult = validate(tenantSchema, tenantJson);
        if (tenantResult.isErr()) {
          throw Err.code("badRequest", { message: "Invalid tenant data" });
        }
        const tenant = tenantResult.value;

        const projectsResult = await projectService.list({
          ctx: { tenant },
        });
        if (projectsResult.isErr()) {
          throw Err.code("unknown");
        }

        const project = projectsResult.value.data.find(
          (p) => p.integration?.webhookSecret === query.secret,
        );
        if (!project) {
          throw Err.code("unauthorized", {
            message: "Invalid webhook secret",
          });
        }

        const workflowsResult = await workflowDefinitionService.list({
          ctx: { tenant },
          filter: { projectId: project.id },
        });
        if (workflowsResult.isErr()) {
          throw Err.code("unknown");
        }

        const activeWorkflows = workflowsResult.value.data.filter(
          (w) => w.isActive,
        );

        if (activeWorkflows.length > 0) {
          await inngestClient.send(
            activeWorkflows.map((w) => ({
              name: WORKFLOW_EXECUTION_TRIGGERED_EVENT,
              data: {
                tenant,
                workflowDefinitionId: w.id,
              },
            })),
          );
        }

        return okEnvelope();
      },
      {
        query: webhookJiraQueryDtoSchema,
      },
    ),
);

export { webhookV1Router };
