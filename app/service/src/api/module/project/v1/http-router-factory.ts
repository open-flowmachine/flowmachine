import Elysia from "elysia";
import { errEnvelope, okEnvelope } from "@/api/http-envelope";
import {
  type ProjectResponseDto,
  patchProjectRequestBodyDtoSchema,
  patchProjectRequestParamsDtoSchema,
  postProjectRequestBodyDtoSchema,
} from "@/api/module/project/v1/http-dto";
import type { HttpAuthGuardFactory } from "@/api/plugin/http-auth-guard-factory";
import type { HttpRequestCtxFactory } from "@/api/plugin/http-request-ctx-factory";
import type { ProjectCrudService } from "@/core/domain/project/crud-service";
import type { ProjectEntity } from "@/core/domain/project/entity";
import type { ProjectService } from "@/core/feature/project/service";

export class ProjectV1HttpRouterFactory {
  #httpAuthGuardFactory: HttpAuthGuardFactory;
  #httpRequestCtxFactory: HttpRequestCtxFactory;
  #projectCrudService: ProjectCrudService;
  #projectService: ProjectService;

  constructor(
    httpAuthGuardFactory: HttpAuthGuardFactory,
    httpRequestCtxFactory: HttpRequestCtxFactory,
    projectCrudService: ProjectCrudService,
    projectService: ProjectService,
  ) {
    this.#httpAuthGuardFactory = httpAuthGuardFactory;
    this.#httpRequestCtxFactory = httpRequestCtxFactory;
    this.#projectCrudService = projectCrudService;
    this.#projectService = projectService;
  }

  make() {
    return new Elysia({ name: ProjectV1HttpRouterFactory.name })
      .use(this.#httpRequestCtxFactory.make())
      .use(this.#httpAuthGuardFactory.make())
      .group("/api/v1/project", (r) =>
        r
          .post(
            "",
            async ({ body, ctx, tenant }) => {
              const result = await this.#projectCrudService.create({
                ctx: { ...ctx, tenant },
                payload: body,
              });
              if (result.isErr()) {
                return errEnvelope(result.error);
              }
              return okEnvelope();
            },
            {
              body: postProjectRequestBodyDtoSchema,
            },
          )
          .get("", async ({ ctx, tenant }) => {
            const result = await this.#projectCrudService.list({
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
              const result = await this.#projectCrudService.get({
                ctx: { ...ctx, tenant },
                payload: { id: params.id },
              });
              if (result.isErr()) {
                return errEnvelope(result.error);
              }
              return okEnvelope({ data: this.#toDto(result.value) });
            },
            {
              params: patchProjectRequestParamsDtoSchema,
            },
          )
          .patch(
            "/:id",
            async ({ body, ctx, tenant, params }) => {
              const result = await this.#projectCrudService.update({
                ctx: { ...ctx, tenant },
                payload: {
                  id: params.id,
                  name: body.name,
                },
              });
              if (result.isErr()) {
                return errEnvelope(result.error);
              }
              return okEnvelope();
            },
            {
              body: patchProjectRequestBodyDtoSchema,
              params: patchProjectRequestParamsDtoSchema,
            },
          )
          .delete(
            "/:id",
            async ({ ctx, tenant, params }) => {
              const result = await this.#projectService.delete({
                ctx: { ...ctx, tenant },
                payload: { id: params.id },
              });
              if (result.isErr()) {
                return errEnvelope(result.error);
              }
              return okEnvelope();
            },
            {
              params: patchProjectRequestParamsDtoSchema,
            },
          ),
      );
  }

  #toDto(entity: ProjectEntity) {
    return {
      id: entity.id,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      tenant: entity.tenant,
      name: entity.props.name,
    } as const satisfies ProjectResponseDto;
  }
}
