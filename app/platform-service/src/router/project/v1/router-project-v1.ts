import Elysia from "elysia";
import type { Project } from "@/module/project/project-model";
import { makeProjectService } from "@/module/project/project-service";

const projectService = makeProjectService();
import type { ProjectResponseDto } from "@/router/project/v1/router-project-v1-dto";
import {
  deleteProjectRequestParamsDtoSchema,
  patchProjectRequestBodyDtoSchema,
  patchProjectRequestParamsDtoSchema,
  postProjectRequestBodyDtoSchema,
} from "@/router/project/v1/router-project-v1-dto";
import { routerAuthGuard } from "@/router/router-auth-guard";
import { errEnvelope, okEnvelope } from "@/shared/http/http-envelope";

const toDto = (project: Project) =>
  ({
    id: project.id,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    name: project.name,
    integration: project.integration,
  }) satisfies ProjectResponseDto;

const projectV1Router = new Elysia({ name: "projectV1HttpRouter" })
  .use(routerAuthGuard)
  .group("/api/v1/project", (r) =>
    r
      .post(
        "",
        async ({ body, tenant }) => {
          const result = await projectService.create({
            ctx: { tenant },
            payload: body,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: { id: result.value.id } });
        },
        {
          body: postProjectRequestBodyDtoSchema,
        },
      )
      .get("", async ({ tenant }) => {
        const result = await projectService.list({
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
          const result = await projectService.get({
            ctx: { tenant },
            id: params.id,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: toDto(result.value.data) });
        },
        {
          params: patchProjectRequestParamsDtoSchema,
        },
      )
      .patch(
        "/:id",
        async ({ body, tenant, params }) => {
          const result = await projectService.update({
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
          body: patchProjectRequestBodyDtoSchema,
          params: patchProjectRequestParamsDtoSchema,
        },
      )
      .delete(
        "/:id",
        async ({ tenant, params }) => {
          const result = await projectService.delete({
            ctx: { tenant },
            id: params.id,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope();
        },
        {
          params: deleteProjectRequestParamsDtoSchema,
        },
      ),
  );

export { projectV1Router };
