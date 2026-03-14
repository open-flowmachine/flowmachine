import Elysia from "elysia";
import { isNil } from "es-toolkit";
import { errEnvelope, okEnvelope } from "@/api/http-envelope";
import { postProjectSyncRequestParamsDtoSchema } from "@/api/module/project/v1/sync/http-dto";
import type { HttpAuthGuardFactory } from "@/api/plugin/http-auth-guard-factory";
import type { HttpRequestCtxFactory } from "@/api/plugin/http-request-ctx-factory";
import type { ProjectSyncBasicService } from "@/app/feature/project/sync/basic-service";

export class ProjectSyncV1HttpRouterFactory {
  #httpAuthGuardFactory: HttpAuthGuardFactory;
  #httpRequestCtxFactory: HttpRequestCtxFactory;
  #projectSyncBasicService: ProjectSyncBasicService;

  constructor(
    httpAuthGuardFactory: HttpAuthGuardFactory,
    httpRequestCtxFactory: HttpRequestCtxFactory,
    projectSyncBasicService: ProjectSyncBasicService,
  ) {
    this.#httpAuthGuardFactory = httpAuthGuardFactory;
    this.#httpRequestCtxFactory = httpRequestCtxFactory;
    this.#projectSyncBasicService = projectSyncBasicService;
  }

  make() {
    return new Elysia({ name: ProjectSyncV1HttpRouterFactory.name })
      .use(this.#httpRequestCtxFactory.make())
      .use(this.#httpAuthGuardFactory.make())
      .group("/api/v1/project/:projectId/sync", (r) =>
        r.post(
          "",
          async ({ ctx, params, tenant }) => {
            const { projectId } = params;

            const syncEntityResults = await Promise.all([
              this.#projectSyncBasicService.syncAiAgents({
                ctx: { ...ctx, tenant },
                payload: { projectId },
              }),
              this.#projectSyncBasicService.syncGitRepositories({
                ctx: { ...ctx, tenant },
                payload: { projectId },
              }),
              this.#projectSyncBasicService.syncWorkflowDefinitions({
                ctx: { ...ctx, tenant },
                payload: { projectId },
              }),
            ]);

            const firstErrResult = syncEntityResults.find((result) =>
              result.isErr(),
            );

            if (!isNil(firstErrResult)) {
              return errEnvelope(firstErrResult.error);
            }
            return okEnvelope();
          },
          {
            params: postProjectSyncRequestParamsDtoSchema,
          },
        ),
      );
  }
}
