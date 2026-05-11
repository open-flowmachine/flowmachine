import Elysia from "elysia";

import type { ProjectIssueFieldDefinitionEntityType } from "@/module/project/project-issue-field-definition-constant";
import type { ProjectIssueFieldDefinition } from "@/module/project/project-issue-field-definition-model";

import { WORKFLOW_EXECUTION_TRIGGERED_EVENT } from "@/feature/workflow/workflow-constant";
import { projectIssueFieldDefinitionNames } from "@/module/project/project-issue-field-definition-constant";
import { makeProjectIssueFieldDefinitionService } from "@/module/project/project-issue-field-definition-service";
import { makeProjectService } from "@/module/project/project-service";
import { makeWorkflowDefinitionService } from "@/module/workflow/workflow-definition-service";
import {
  jiraIssueUpdatedEventDtoSchema,
  jiraSelectFieldValueSchema,
  webhookJiraQueryDtoSchema,
} from "@/router/webhook/v1/router-webhook-v1-dto";
import { Err } from "@/shared/err/err";
import { okEnvelope } from "@/shared/http/http-envelope";
import { validate } from "@/shared/schema/schema-validation";
import { decodeTenant } from "@/shared/tenant/tenant-encoding";
import { verifyWebhookSignature } from "@/shared/webhook/webhook-signature";
import { inngestClient } from "@/vendor/inngest/inngest-client";

const projectService = makeProjectService();
const projectIssueFieldDefinitionService =
  makeProjectIssueFieldDefinitionService();
const workflowDefinitionService = makeWorkflowDefinitionService();

const findFieldDefinitionByName = (
  definitions: ProjectIssueFieldDefinition[],
  entityType: ProjectIssueFieldDefinitionEntityType,
) => {
  const fieldName = projectIssueFieldDefinitionNames[entityType];
  return definitions.find((d) => d.name === fieldName);
};

const extractCustomFieldValue = (
  fields: Record<string, unknown>,
  definition: ProjectIssueFieldDefinition | undefined,
  entityType: ProjectIssueFieldDefinitionEntityType,
) => {
  const fieldName = projectIssueFieldDefinitionNames[entityType];

  if (!definition?.integration?.externalKey) {
    throw Err.code("badRequest", {
      message: `Project missing "${fieldName}" custom field`,
    });
  }
  const raw = fields[definition.integration.externalKey];
  const parsed = validate(jiraSelectFieldValueSchema, raw);

  if (parsed.isErr()) {
    throw Err.code("badRequest", {
      message: `Issue missing "${fieldName}" value`,
    });
  }
  return parsed.value.value;
};

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

        const fieldDefinitionsResult =
          await projectIssueFieldDefinitionService.list({
            ctx: { tenant },
            filter: { projectId: project.id },
          });

        if (fieldDefinitionsResult.isErr()) {
          throw Err.from(fieldDefinitionsResult.error);
        }
        const fieldDefinitions = fieldDefinitionsResult.value.data;

        const workflowDefinitionField = findFieldDefinitionByName(
          fieldDefinitions,
          "workflowDefinition",
        );
        const aiAgentField = findFieldDefinitionByName(
          fieldDefinitions,
          "aiAgent",
        );
        const gitRepositoryField = findFieldDefinitionByName(
          fieldDefinitions,
          "gitRepository",
        );

        const workflowDefinitionId = extractCustomFieldValue(
          issue.fields,
          workflowDefinitionField,
          "workflowDefinition",
        );
        const aiAgentId = extractCustomFieldValue(
          issue.fields,
          aiAgentField,
          "aiAgent",
        );
        const gitRepositoryId = extractCustomFieldValue(
          issue.fields,
          gitRepositoryField,
          "gitRepository",
        );

        const workflowResult = await workflowDefinitionService.get({
          ctx: { tenant },
          id: workflowDefinitionId,
        });

        if (workflowResult.isErr()) {
          throw Err.from(workflowResult.error);
        }
        const workflow = workflowResult.value.data;

        if (!workflow.isActive) {
          throw Err.code("badRequest", {
            message: "Workflow definition is not active",
          });
        }
        if (!workflow.projects.some((p) => p.id === project.id)) {
          throw Err.code("badRequest", {
            message: "Workflow definition does not belong to project",
          });
        }

        await inngestClient.send({
          name: WORKFLOW_EXECUTION_TRIGGERED_EVENT,
          data: {
            tenant,
            workflowDefinitionId,
            aiAgentId,
            gitRepositoryId,
            title,
            summary,
          },
        });

        return okEnvelope();
      },
      {
        query: webhookJiraQueryDtoSchema,
      },
    ),
);

export { webhookV1Router };
