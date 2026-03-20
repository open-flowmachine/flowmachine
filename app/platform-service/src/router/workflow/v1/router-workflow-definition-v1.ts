import Elysia from "elysia";
import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-model";
import { makeWorkflowDefinitionService } from "@/module/workflow/workflow-definition-service";

const workflowDefinitionService = makeWorkflowDefinitionService();
import type { WorkflowDefinitionResponseDto } from "@/router/workflow/v1/router-workflow-definition-v1-dto";
import {
  deleteWorkflowDefinitionRequestParamsDtoSchema,
  patchWorkflowDefinitionRequestBodyDtoSchema,
  patchWorkflowDefinitionRequestParamsDtoSchema,
  postWorkflowDefinitionRequestBodyDtoSchema,
} from "@/router/workflow/v1/router-workflow-definition-v1-dto";
import { routerAuthGuard } from "@/router/router-auth-guard";
import { errEnvelope, okEnvelope } from "@/shared/http/http-envelope";

const toDto = (definition: WorkflowDefinition) =>
  ({
    id: definition.id,
    createdAt: definition.createdAt,
    updatedAt: definition.updatedAt,
    name: definition.name,
    description: definition.description,
    projects: definition.projects,
    actions: definition.actions,
    edges: definition.edges,
    isActive: definition.isActive,
  }) satisfies WorkflowDefinitionResponseDto;

const workflowDefinitionV1Router = new Elysia({
  name: "workflowDefinitionV1HttpRouter",
})
  .use(routerAuthGuard)
  .group("/api/v1/workflow-definition", (r) =>
    r
      .post(
        "",
        async ({ body, tenant }) => {
          const result = await workflowDefinitionService.create({
            ctx: { tenant },
            payload: body,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: { id: result.value.id } });
        },
        {
          body: postWorkflowDefinitionRequestBodyDtoSchema,
        },
      )
      .get("", async ({ tenant }) => {
        const result = await workflowDefinitionService.list({
          ctx: { tenant },
        });
        if (result.isErr()) {
          return errEnvelope(result.error);
        }
        return okEnvelope({
          data: result.value.data.map(toDto),
        });
      })
      .get(
        "/:id",
        async ({ tenant, params }) => {
          const result = await workflowDefinitionService.get({
            ctx: { tenant },
            id: params.id,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: toDto(result.value.data) });
        },
        {
          params: patchWorkflowDefinitionRequestParamsDtoSchema,
        },
      )
      .patch(
        "/:id",
        async ({ body, tenant, params }) => {
          const result = await workflowDefinitionService.update({
            ctx: { tenant },
            id: params.id,
            data: body,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope();
        },
        {
          body: patchWorkflowDefinitionRequestBodyDtoSchema,
          params: patchWorkflowDefinitionRequestParamsDtoSchema,
        },
      )
      .delete(
        "/:id",
        async ({ tenant, params }) => {
          const result = await workflowDefinitionService.delete({
            ctx: { tenant },
            id: params.id,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope();
        },
        {
          params: deleteWorkflowDefinitionRequestParamsDtoSchema,
        },
      ),
  );

export { workflowDefinitionV1Router };
