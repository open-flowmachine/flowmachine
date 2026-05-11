import Elysia from "elysia";

import { WORKFLOW_EXECUTION_TRIGGERED_EVENT } from "@/feature/workflow/workflow-constant";
import { makeProjectService } from "@/module/project/project-service";
import { makeWorkflowDefinitionService } from "@/module/workflow/workflow-definition-service";
import {
  jiraIssueUpdatedEventDtoSchema,
  webhookJiraQueryDtoSchema,
} from "@/router/webhook/v1/router-webhook-v1-dto";
import { Err } from "@/shared/err/err";
import { okEnvelope } from "@/shared/http/http-envelope";
import { validate } from "@/shared/schema/schema-validation";
import { decodeTenant } from "@/shared/tenant/tenant-encoding";
import { verifyWebhookSignature } from "@/shared/webhook/webhook-signature";
import { inngestClient } from "@/vendor/inngest/inngest-client";

const projectService = makeProjectService();
const workflowDefinitionService = makeWorkflowDefinitionService();

const webhookV1Router = new Elysia({ name: "webhookV1Router" }).group(
  "/api/v1/webhook",
  (r) =>
    r.post(
      "/jira",
      async ({ query, headers, body }) => {
        const rawBody = typeof body === "string" ? body : JSON.stringify(body);

        const tenantResult = decodeTenant(query.tenant);

        if (tenantResult.isErr()) {
          throw tenantResult.error;
        }
        const tenant = tenantResult.value;

        const signatureHeader = headers["x-hub-signature"];

        if (!signatureHeader) {
          throw Err.code("unauthorized", {
            message: "Missing webhook signature",
          });
        }
        const projectResult = await projectService.get({
          ctx: { tenant },
          id: query.projectId,
        });

        if (projectResult.isErr()) {
          throw Err.from(projectResult.error);
        }
        const project = projectResult.value.data;

        if (project.integration?.provider !== "jira") {
          throw Err.code("notFound");
        }
        if (
          !verifyWebhookSignature(
            rawBody,
            project.integration.webhookSecret,
            signatureHeader,
          )
        ) {
          throw Err.code("unauthorized", {
            message: "Invalid webhook signature",
          });
        }

        const parsedBody = typeof body === "string" ? JSON.parse(body) : body;
        const bodyResult = validate(jiraIssueUpdatedEventDtoSchema, parsedBody);

        if (bodyResult.isErr()) {
          throw Err.code("badRequest", {
            message: "Invalid Jira issue updated event payload",
          });
        }
        const { issue } = bodyResult.value;
        const title = issue.fields.summary;
        const summary = issue.fields.description ?? "Untitled";

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
                title,
                summary,
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
