import Elysia from "elysia";
import type { Project } from "@/module/project/project-model";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "@/module/project/project-service";
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
          const result = await createProject({
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
        const result = await listProjects({
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
          const result = await getProject({
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
          const result = await updateProject({
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
          const result = await deleteProject({
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
