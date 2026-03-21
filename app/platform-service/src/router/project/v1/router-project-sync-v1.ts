import Elysia from "elysia";
import { isNil } from "es-toolkit";
import type { ExternalProjectService } from "@/feature/project/project-sync-service";
import { makeProjectSyncService } from "@/feature/project/project-sync-service";
import { makeAiAgentService } from "@/module/ai-agent/ai-agent-service";
import { makeCredentialService } from "@/module/credential/credential-service";
import { makeGitRepositoryService } from "@/module/git-repository/git-repository-service";
import { makeProjectIssueFieldDefinitionService } from "@/module/project/project-issue-field-definition-service";
import { makeProjectService } from "@/module/project/project-service";
import { makeWorkflowDefinitionService } from "@/module/workflow/workflow-definition-service";
import { postProjectSyncRequestParamsDtoSchema } from "@/router/project/v1/router-project-sync-v1-dto";
import { routerAuthGuard } from "@/router/router-auth-guard";
import { errEnvelope, okEnvelope } from "@/shared/http/http-envelope";
import { makeJiraService } from "@/vendor/jira/jira-service";

const jiraService = makeJiraService();

const externalProjectService: ExternalProjectService = {
  createCustomIssueField: (input) =>
    jiraService.createCustomIssueField({
      credential: input.credential as never,
      project: input.project,
      fieldDefinition: input.projectIssueFieldDefinition,
    }),
  deleteCustomIssueField: (input) =>
    jiraService.deleteCustomIssueField({
      credential: input.credential as never,
      project: input.project,
      fieldDefinition: input.projectIssueFieldDefinition,
    }),
};

const projectSyncService = makeProjectSyncService({
  projectService: makeProjectService(),
  credentialService: makeCredentialService(),
  aiAgentService: makeAiAgentService(),
  gitRepositoryService: makeGitRepositoryService(),
  workflowDefinitionService: makeWorkflowDefinitionService(),
  projectIssueFieldDefinitionService: makeProjectIssueFieldDefinitionService(),
  externalProjectService,
});

const projectSyncV1Router = new Elysia({ name: "projectSyncV1HttpRouter" })
  .use(routerAuthGuard)
  .group("/api/v1/project/:projectId/sync", (r) =>
    r.post(
      "",
      async ({ tenant, params }) => {
        const { projectId } = params;

        const syncEntityResults = await Promise.all([
          projectSyncService.syncAiAgentToExternal({
            ctx: { tenant },
            payload: { projectId },
          }),
          projectSyncService.syncGitRepositoryToExternal({
            ctx: { tenant },
            payload: { projectId },
          }),
          projectSyncService.syncWorkflowDefinitionToExternal({
            ctx: { tenant },
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

export { projectSyncV1Router };
