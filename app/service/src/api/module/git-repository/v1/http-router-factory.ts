import Elysia from "elysia";
import { errEnvelope, okEnvelope } from "@/api/http-envelope";
import {
  type GitRepositoryResponseDto,
  patchGitRepositoryRequestBodyDtoSchema,
  patchGitRepositoryRequestParamsDtoSchema,
  postGitRepositoryRequestBodyDtoSchema,
} from "@/api/module/git-repository/v1/http-dto";
import type { HttpAuthGuardFactory } from "@/api/plugin/http-auth-guard-factory";
import type { HttpRequestCtxFactory } from "@/api/plugin/http-request-ctx-factory";
import type { GitRepositoryCrudService } from "@/core/domain/git-repository/crud-service";
import type { GitRepositoryEntity } from "@/core/domain/git-repository/entity";

export class GitRepositoryV1HttpRouterFactory {
  #httpAuthGuardFactory: HttpAuthGuardFactory;
  #httpRequestCtxFactory: HttpRequestCtxFactory;
  #gitRepositoryCrudService: GitRepositoryCrudService;

  constructor(
    httpAuthGuardFactory: HttpAuthGuardFactory,
    httpRequestCtxFactory: HttpRequestCtxFactory,
    gitRepositoryCrudService: GitRepositoryCrudService,
  ) {
    this.#httpAuthGuardFactory = httpAuthGuardFactory;
    this.#httpRequestCtxFactory = httpRequestCtxFactory;
    this.#gitRepositoryCrudService = gitRepositoryCrudService;
  }

  make() {
    return new Elysia({ name: GitRepositoryV1HttpRouterFactory.name })
      .use(this.#httpRequestCtxFactory.make())
      .use(this.#httpAuthGuardFactory.make())
      .group("/api/v1/git-repository", (r) =>
        r
          .post(
            "",
            async ({ body, ctx, tenant }) => {
              const result = await this.#gitRepositoryCrudService.create({
                ctx: { ...ctx, tenant },
                payload: body,
              });
              if (result.isErr()) {
                return errEnvelope(result.error);
              }
              return okEnvelope();
            },
            {
              body: postGitRepositoryRequestBodyDtoSchema,
            },
          )
          .get("", async ({ ctx, tenant }) => {
            const result = await this.#gitRepositoryCrudService.list({
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
              const result = await this.#gitRepositoryCrudService.get({
                ctx: { ...ctx, tenant },
                payload: { id: params.id },
              });
              if (result.isErr()) {
                return errEnvelope(result.error);
              }
              return okEnvelope({ data: this.#toDto(result.value) });
            },
            {
              params: patchGitRepositoryRequestParamsDtoSchema,
            },
          )
          .patch(
            "/:id",
            async ({ body, ctx, tenant, params }) => {
              const result = await this.#gitRepositoryCrudService.update({
                ctx: { ...ctx, tenant },
                payload: {
                  id: params.id,
                  name: body.name,
                  url: body.url,
                  config: body.config,
                  integration: body.integration,
                  projects: body.projects,
                },
              });
              if (result.isErr()) {
                return errEnvelope(result.error);
              }
              return okEnvelope();
            },
            {
              body: patchGitRepositoryRequestBodyDtoSchema,
              params: patchGitRepositoryRequestParamsDtoSchema,
            },
          )
          .delete(
            "/:id",
            async ({ ctx, tenant, params }) => {
              const result = await this.#gitRepositoryCrudService.delete({
                ctx: { ...ctx, tenant },
                payload: { id: params.id },
              });
              if (result.isErr()) {
                return errEnvelope(result.error);
              }
              return okEnvelope();
            },
            {
              params: patchGitRepositoryRequestParamsDtoSchema,
            },
          ),
      );
  }

  #toDto(entity: GitRepositoryEntity) {
    return {
      id: entity.id,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      tenant: entity.tenant,
      name: entity.props.name,
      url: entity.props.url,
      config: entity.props.config,
      integration: entity.props.integration,
      projects: entity.props.projects,
    } as const satisfies GitRepositoryResponseDto;
  }
}
