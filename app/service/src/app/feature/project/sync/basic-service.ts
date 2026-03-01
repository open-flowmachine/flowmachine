import { err, ok } from "neverthrow";
import type { Result } from "neverthrow";
import type z from "zod";
import { Err } from "@/common/err/err";
import type { AiAgentCrudService } from "@/core/domain/ai-agent/crud-service";
import type { CredentialCrudService } from "@/core/domain/credential/crud-service";
import type { CredentialEntity } from "@/core/domain/credential/entity";
import type { GitRepositoryCrudService } from "@/core/domain/git-repository/crud-service";
import type { ProjectCrudService } from "@/core/domain/project/crud-service";
import type { ProjectEntity } from "@/core/domain/project/entity";
import type { WorkflowDefinitionCrudService } from "@/core/domain/workflow/definition/crud-service";
import type {
  ProjectSyncService,
  projectSyncServiceInputSchema,
} from "@/core/feature/project/sync/service";
import type { ExternalProjectService } from "@/core/infra/external/project/service";

export class ProjectSyncBasicService implements ProjectSyncService {
  #projectCrudService: ProjectCrudService;
  #credentialCrudService: CredentialCrudService;
  #aiAgentCrudService: AiAgentCrudService;
  #gitRepositoryCrudService: GitRepositoryCrudService;
  #workflowDefinitionCrudService: WorkflowDefinitionCrudService;
  #externalProjectService: ExternalProjectService;

  constructor(
    projectCrudService: ProjectCrudService,
    credentialCrudService: CredentialCrudService,
    aiAgentCrudService: AiAgentCrudService,
    gitRepositoryCrudService: GitRepositoryCrudService,
    workflowDefinitionCrudService: WorkflowDefinitionCrudService,
    externalProjectService: ExternalProjectService,
  ) {
    this.#projectCrudService = projectCrudService;
    this.#credentialCrudService = credentialCrudService;
    this.#aiAgentCrudService = aiAgentCrudService;
    this.#gitRepositoryCrudService = gitRepositoryCrudService;
    this.#workflowDefinitionCrudService = workflowDefinitionCrudService;
    this.#externalProjectService = externalProjectService;
  }

  async syncAiAgentsToExternal(
    input: z.infer<typeof projectSyncServiceInputSchema.syncAiAgentsToExternal>,
  ): Promise<Result<void, Err>> {
    const { ctx, projectId } = input;

    const resolveResult = await this.#resolveProjectAndCredential(
      ctx,
      projectId,
    );

    if (resolveResult.isErr()) {
      return err(resolveResult.error);
    }
    const { project, credential } = resolveResult.value;

    const listResult = await this.#aiAgentCrudService.list({
      ctx,
      filter: { projectId },
    });

    if (listResult.isErr()) {
      return err(listResult.error);
    }
    for (const aiAgent of listResult.value) {
      aiAgent.markProjectForSync({ projectId });

      await this.#aiAgentCrudService.update({
        ctx,
        payload: { id: aiAgent.id, projects: aiAgent.props.projects },
      });

      const syncResult =
        await this.#externalProjectService.syncAiAgentIssueField({
          ctx,
          credential,
          project,
          aiAgent,
        });

      if (syncResult.isOk()) {
        aiAgent.markProjectAsSynced({ projectId });
      } else {
        aiAgent.markProjectSyncError({ projectId });
      }

      await this.#aiAgentCrudService.update({
        ctx,
        payload: { id: aiAgent.id, projects: aiAgent.props.projects },
      });
    }

    return ok();
  }

  async syncGitRepositoriesToExternal(
    input: z.infer<
      typeof projectSyncServiceInputSchema.syncGitRepositoriesToExternal
    >,
  ): Promise<Result<void, Err>> {
    const { ctx, projectId } = input;

    const resolveResult = await this.#resolveProjectAndCredential(
      ctx,
      projectId,
    );

    if (resolveResult.isErr()) {
      return err(resolveResult.error);
    }
    const { project, credential } = resolveResult.value;

    const listResult = await this.#gitRepositoryCrudService.list({
      ctx,
      filter: { projectId },
    });

    if (listResult.isErr()) {
      return err(listResult.error);
    }
    for (const gitRepository of listResult.value) {
      gitRepository.markProjectForSync({ projectId });

      await this.#gitRepositoryCrudService.update({
        ctx,
        payload: {
          id: gitRepository.id,
          projects: gitRepository.props.projects,
        },
      });

      const syncResult =
        await this.#externalProjectService.syncGitRepositoryIssueField({
          ctx,
          credential,
          project,
          gitRepository,
        });

      if (syncResult.isOk()) {
        gitRepository.markProjectAsSynced({ projectId });
      } else {
        gitRepository.markProjectSyncError({ projectId });
      }

      await this.#gitRepositoryCrudService.update({
        ctx,
        payload: {
          id: gitRepository.id,
          projects: gitRepository.props.projects,
        },
      });
    }

    return ok();
  }

  async syncWorkflowDefinitionsToExternal(
    input: z.infer<
      typeof projectSyncServiceInputSchema.syncWorkflowDefinitionsToExternal
    >,
  ): Promise<Result<void, Err>> {
    const { ctx, projectId } = input;

    const resolveResult = await this.#resolveProjectAndCredential(
      ctx,
      projectId,
    );

    if (resolveResult.isErr()) {
      return err(resolveResult.error);
    }
    const { project, credential } = resolveResult.value;

    const listResult = await this.#workflowDefinitionCrudService.list({
      ctx,
      filter: { projectId },
    });

    if (listResult.isErr()) {
      return err(listResult.error);
    }
    for (const workflowDefinition of listResult.value) {
      workflowDefinition.markProjectForSync({ projectId });

      await this.#workflowDefinitionCrudService.update({
        ctx,
        payload: {
          id: workflowDefinition.id,
          projects: workflowDefinition.props.projects,
        },
      });

      const syncResult =
        await this.#externalProjectService.syncWorkflowDefinitionIssueField({
          ctx,
          credential,
          project,
          workflowDefinition,
        });

      if (syncResult.isOk()) {
        workflowDefinition.markProjectAsSynced({ projectId });
      } else {
        workflowDefinition.markProjectSyncError({ projectId });
      }

      await this.#workflowDefinitionCrudService.update({
        ctx,
        payload: {
          id: workflowDefinition.id,
          projects: workflowDefinition.props.projects,
        },
      });
    }

    return ok();
  }

  async #resolveProjectAndCredential(
    ctx: z.infer<
      typeof projectSyncServiceInputSchema.syncAiAgentsToExternal
    >["ctx"],
    projectId: string,
  ): Promise<
    Result<{ project: ProjectEntity; credential: CredentialEntity }, Err>
  > {
    const projectResult = await this.#projectCrudService.get({
      ctx,
      payload: { id: projectId },
    });

    if (projectResult.isErr()) {
      return err(projectResult.error);
    }
    const project = projectResult.value;

    const integration = project.props.integration;

    if (!integration) {
      return err(
        Err.code("badRequest", {
          message: "Project has no integration configured",
        }),
      );
    }
    const credentialResult = await this.#credentialCrudService.get({
      ctx,
      payload: { id: integration.credentialId },
    });

    if (credentialResult.isErr()) {
      return err(credentialResult.error);
    }
    const credential = credentialResult.value;

    return ok({ project, credential });
  }
}
