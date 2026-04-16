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
import { tenantSchema } from "@/shared/model/model-tenant";
import { validate } from "@/shared/schema/schema-validation";
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

        // 1. Decode tenant from URL-encoded query parameter
        let tenantJson: unknown;
        try {
          tenantJson = JSON.parse(decodeURIComponent(query.tenant));
        } catch {
          throw Err.code("badRequest", { message: "Invalid tenant encoding" });
        }

        const tenantResult = validate(tenantSchema, tenantJson);
        if (tenantResult.isErr()) {
          throw Err.code("badRequest", { message: "Invalid tenant data" });
        }
        const tenant = tenantResult.value;

        // 2. Validate webhook signature (X-Hub-Signature) against project secret
        const signatureHeader = headers["x-hub-signature"];
        if (!signatureHeader) {
          throw Err.code("unauthorized", {
            message: "Missing webhook signature",
          });
        }

        const projectsResult = await projectService.list({
          ctx: { tenant },
        });
        if (projectsResult.isErr()) {
          throw Err.code("unknown");
        }

        const project = projectsResult.value.data.find(
          (p) =>
            p.integration?.webhookSecret &&
            verifyWebhookSignature(
              rawBody,
              p.integration.webhookSecret,
              signatureHeader,
            ),
        );
        if (!project) {
          throw Err.code("unauthorized", {
            message: "Invalid webhook signature",
          });
        }

        // 3. Parse Jira issue updated event body
        const parsedBody = typeof body === "string" ? JSON.parse(body) : body;
        const bodyResult = validate(jiraIssueUpdatedEventDtoSchema, parsedBody);
        if (bodyResult.isErr()) {
          throw Err.code("badRequest", {
            message: "Invalid Jira issue updated event payload",
          });
        }

        const { issue } = bodyResult.value;
        const title = issue.fields.summary;
        const summary = issue.fields.description ?? "";

        // 4. Find active workflow definitions for this project
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

        // 5. Trigger workflow executions via Inngest
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
