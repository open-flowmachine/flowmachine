import Elysia from "elysia";
import type { GitRepository } from "@/module/git-repository/git-repository-model";
import {
  createGitRepository,
  deleteGitRepository,
  getGitRepository,
  listGitRepositories,
  updateGitRepository,
} from "@/module/git-repository/git-repository-service";
import type { GitRepositoryResponseDto } from "@/router/git-repository/v1/router-git-repository-v1-dto";
import {
  deleteGitRepositoryRequestParamsDtoSchema,
  getGitRepositoryListRequestQueryDtoSchema,
  getGitRepositoryRequestParamsDtoSchema,
  patchGitRepositoryRequestBodyDtoSchema,
  patchGitRepositoryRequestParamsDtoSchema,
  postGitRepositoryRequestBodyDtoSchema,
} from "@/router/git-repository/v1/router-git-repository-v1-dto";
import { routerAuthGuard } from "@/router/router-auth-guard";
import { errEnvelope, okEnvelope } from "@/shared/http/http-envelope";

const toDto = (gitRepository: GitRepository) =>
  ({
    id: gitRepository.id,
    createdAt: gitRepository.createdAt,
    updatedAt: gitRepository.updatedAt,
    name: gitRepository.name,
    url: gitRepository.url,
    config: gitRepository.config,
    integration: gitRepository.integration,
    projects: gitRepository.projects,
  }) satisfies GitRepositoryResponseDto;

const gitRepositoryV1Router = new Elysia({
  name: "gitRepositoryV1HttpRouter",
})
  .use(routerAuthGuard)
  .group("/api/v1/git-repository", (r) =>
    r
      .post(
        "",
        async ({ body, tenant }) => {
          const result = await createGitRepository({
            ctx: { tenant },
            payload: body,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: { id: result.value.id } });
        },
        {
          body: postGitRepositoryRequestBodyDtoSchema,
        },
      )
      .get(
        "",
        async ({ tenant, query }) => {
          const result = await listGitRepositories({
            ctx: { tenant },
            filter: query.projectId ? { projectId: query.projectId } : undefined,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({
            data: result.value.data.map(toDto),
          });
        },
        {
          query: getGitRepositoryListRequestQueryDtoSchema,
        },
      )
      .get(
        "/:id",
        async ({ tenant, params }) => {
          const result = await getGitRepository({
            ctx: { tenant },
            id: params.id,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: toDto(result.value.data) });
        },
        {
          params: getGitRepositoryRequestParamsDtoSchema,
        },
      )
      .patch(
        "/:id",
        async ({ body, tenant, params }) => {
          const result = await updateGitRepository({
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
          body: patchGitRepositoryRequestBodyDtoSchema,
          params: patchGitRepositoryRequestParamsDtoSchema,
        },
      )
      .delete(
        "/:id",
        async ({ tenant, params }) => {
          const result = await deleteGitRepository({
            ctx: { tenant },
            id: params.id,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope();
        },
        {
          params: deleteGitRepositoryRequestParamsDtoSchema,
        },
      ),
  );

export { gitRepositoryV1Router };
