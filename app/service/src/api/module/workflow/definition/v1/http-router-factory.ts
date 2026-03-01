import Elysia from "elysia";
import { errEnvelope, okEnvelope } from "@/api/http-envelope";
import {
  type WorkflowDefinitionResponseDto,
  patchWorkflowDefinitionRequestBodyDtoSchema,
  patchWorkflowDefinitionRequestParamsDtoSchema,
  postWorkflowDefinitionRequestBodyDtoSchema,
} from "@/api/module/workflow/definition/v1/http-dto";
import type { HttpAuthGuardFactory } from "@/api/plugin/http-auth-guard-factory";
import type { HttpRequestCtxFactory } from "@/api/plugin/http-request-ctx-factory";
import type { WorkflowDefinitionCrudService } from "@/core/domain/workflow/definition/crud-service";
import type { WorkflowDefinitionEntity } from "@/core/domain/workflow/definition/entity";

export class WorkflowDefinitionV1HttpRouterFactory {
  #httpAuthGuardFactory: HttpAuthGuardFactory;
  #httpRequestCtxFactory: HttpRequestCtxFactory;
  #workflowDefinitionCrudService: WorkflowDefinitionCrudService;

  constructor(
    httpAuthGuardFactory: HttpAuthGuardFactory,
    httpRequestCtxFactory: HttpRequestCtxFactory,
    workflowDefinitionCrudService: WorkflowDefinitionCrudService,
  ) {
    this.#httpAuthGuardFactory = httpAuthGuardFactory;
    this.#httpRequestCtxFactory = httpRequestCtxFactory;
    this.#workflowDefinitionCrudService = workflowDefinitionCrudService;
  }

  make() {
    return new Elysia({ name: WorkflowDefinitionV1HttpRouterFactory.name })
      .use(this.#httpRequestCtxFactory.make())
      .use(this.#httpAuthGuardFactory.make())
      .group("/api/v1/workflow-definition", (r) =>
        r
          .post(
            "",
            async ({ body, ctx, tenant }) => {
              const result = await this.#workflowDefinitionCrudService.create({
                ctx: { ...ctx, tenant },
                payload: body,
              });
              if (result.isErr()) {
                return errEnvelope(result.error);
              }
              return okEnvelope();
            },
            {
              body: postWorkflowDefinitionRequestBodyDtoSchema,
            },
          )
          .get("", async ({ ctx, tenant }) => {
            const result = await this.#workflowDefinitionCrudService.list({
              ctx: { ...ctx, tenant },
            });
            if (result.isErr()) {
              return errEnvelope(result.error);
            }
            return okEnvelope({
              data: result.value.map(this.#toDto),
            });
          })
          .get(
            "/:id",
            async ({ ctx, tenant, params }) => {
              const result = await this.#workflowDefinitionCrudService.get({
                ctx: { ...ctx, tenant },
                payload: { id: params.id },
              });
              if (result.isErr()) {
                return errEnvelope(result.error);
              }
              return okEnvelope({ data: this.#toDto(result.value) });
            },
            {
              params: patchWorkflowDefinitionRequestParamsDtoSchema,
            },
          )
          .patch(
            "/:id",
            async ({ body, ctx, tenant, params }) => {
              const result = await this.#workflowDefinitionCrudService.update({
                ctx: { ...ctx, tenant },
                payload: {
                  id: params.id,
                  name: body.name,
                  description: body.description,
                  projects: body.projects,
                  actions: body.actions,
                  edges: body.edges,
                  isActive: body.isActive,
                },
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
            async ({ ctx, tenant, params }) => {
              const result = await this.#workflowDefinitionCrudService.delete({
                ctx: { ...ctx, tenant },
                payload: { id: params.id },
              });
              if (result.isErr()) {
                return errEnvelope(result.error);
              }
              return okEnvelope();
            },
            {
              params: patchWorkflowDefinitionRequestParamsDtoSchema,
            },
          ),
      );
  }

  #toDto(entity: WorkflowDefinitionEntity) {
    return {
      id: entity.id,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      tenant: entity.tenant,
      name: entity.props.name,
      description: entity.props.description,
      projects: entity.props.projects,
      actions: entity.props.actions,
      edges: entity.props.edges,
      isActive: entity.props.isActive,
    } as const satisfies WorkflowDefinitionResponseDto;
  }
}
