import { isNil } from "es-toolkit";
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
import type { ProjectIssueFieldDefinitionCrudService } from "@/core/domain/project/issue/field/definition/crud-service";
import type { IssueFieldType } from "@/core/domain/project/issue/field/type";
import type { WorkflowDefinitionCrudService } from "@/core/domain/workflow/definition/crud-service";
import type {
  ProjectSyncService,
  projectSyncServiceInputSchema,
} from "@/core/feature/project/sync/service";
import type { ExternalProjectService } from "@/core/infra/external/project/service";

const entityTypeToFieldName = {
  aiAgent: "AI Agent",
  gitRepository: "Git Repository",
  workflowDefinition: "Workflow Definition",
} as const satisfies Record<string, string>;

const entityTypeToFieldType = {
  aiAgent: "select",
  gitRepository: "select",
  workflowDefinition: "select",
} as const satisfies Record<string, IssueFieldType>;

export class ProjectSyncBasicService implements ProjectSyncService {
  #projectCrudService: ProjectCrudService;
  #credentialCrudService: CredentialCrudService;
  #aiAgentCrudService: AiAgentCrudService;
  #gitRepositoryCrudService: GitRepositoryCrudService;
  #workflowDefinitionCrudService: WorkflowDefinitionCrudService;
  #projectIssueFieldDefinitionCrudService: ProjectIssueFieldDefinitionCrudService;
  #externalProjectService: ExternalProjectService;

  constructor(
    projectCrudService: ProjectCrudService,
    credentialCrudService: CredentialCrudService,
    aiAgentCrudService: AiAgentCrudService,
    gitRepositoryCrudService: GitRepositoryCrudService,
    workflowDefinitionCrudService: WorkflowDefinitionCrudService,
    projectIssueFieldDefinitionCrudService: ProjectIssueFieldDefinitionCrudService,
    externalProjectService: ExternalProjectService,
  ) {
    this.#projectCrudService = projectCrudService;
    this.#credentialCrudService = credentialCrudService;
    this.#aiAgentCrudService = aiAgentCrudService;
    this.#gitRepositoryCrudService = gitRepositoryCrudService;
    this.#workflowDefinitionCrudService = workflowDefinitionCrudService;
    this.#projectIssueFieldDefinitionCrudService =
      projectIssueFieldDefinitionCrudService;
    this.#externalProjectService = externalProjectService;
  }

  async syncAiAgents(
    input: z.infer<typeof projectSyncServiceInputSchema.syncAiAgents>,
  ): Promise<Result<void, Err>> {
    const { ctx, payload } = input;
    const { projectId } = payload;

    const resolveResult = await this.#resolveProjectAndCredential(
      ctx,
      projectId,
    );

    if (resolveResult.isErr()) {
      return err(resolveResult.error);
    }
    const { project, credential } = resolveResult.value;

    if (isNil(project.props.integration)) {
      return ok();
    }
    const listAiAgentsResult = await this.#aiAgentCrudService.list({
      ctx,
      filter: { projectId },
    });

    if (listAiAgentsResult.isErr()) {
      return err(listAiAgentsResult.error);
    }
    const aiAgents = listAiAgentsResult.value;

    const listIssueFieldDefinitionsResult =
      await this.#projectIssueFieldDefinitionCrudService.list({
        ctx,
        filter: { projectId, name: entityTypeToFieldName.aiAgent },
      });

    if (listIssueFieldDefinitionsResult.isErr()) {
      return err(listIssueFieldDefinitionsResult.error);
    }
    const issueFieldDefinition = listIssueFieldDefinitionsResult.value[0];

    if (isNil(issueFieldDefinition)) {
      const createIssueFieldDefinitionResult =
        await this.#projectIssueFieldDefinitionCrudService.create({
          ctx,
          payload: {
            type: entityTypeToFieldType.aiAgent,
            name: entityTypeToFieldName.aiAgent,
            options: aiAgents.map((agent) => ({
              label: agent.props.name,
              value: agent.id,
            })),
            project: { id: projectId },
          },
        });

      if (createIssueFieldDefinitionResult.isErr()) {
        return err(createIssueFieldDefinitionResult.error);
      }
      const issueFieldDefinition = createIssueFieldDefinitionResult.value;

      const createExternalIssueFieldResult =
        await this.#externalProjectService.createCustomIssueField({
          ctx,
          credential,
          project,
          projectIssueFieldDefinition: issueFieldDefinition,
        });

      if (createExternalIssueFieldResult.isErr()) {
        return err(createExternalIssueFieldResult.error);
      }
      const { externalId, externalKey } = createExternalIssueFieldResult.value;

      await this.#projectIssueFieldDefinitionCrudService.update({
        ctx,
        payload: {
          id: issueFieldDefinition.id,
          integration: {
            externalId,
            externalKey,
            provider: project.props.integration.provider,
          },
        },
      });
      return ok();
    }

    const deleteExternalIssueFieldResult =
      await this.#externalProjectService.deleteCustomIssueField({
        ctx,
        credential,
        project,
        projectIssueFieldDefinition: issueFieldDefinition,
      });

    if (deleteExternalIssueFieldResult.isErr()) {
      return err(deleteExternalIssueFieldResult.error);
    }
    const updateIssueFieldDefinitionResult =
      await this.#projectIssueFieldDefinitionCrudService.update({
        ctx,
        payload: {
          id: issueFieldDefinition.id,
          options: aiAgents.map((agent) => ({
            label: agent.props.name,
            value: agent.id,
          })),
        },
      });

    if (updateIssueFieldDefinitionResult.isErr()) {
      return err(updateIssueFieldDefinitionResult.error);
    }
    const updatedIssueFieldDefinition = updateIssueFieldDefinitionResult.value;

    const createExternalIssueFieldResult =
      await this.#externalProjectService.createCustomIssueField({
        ctx,
        credential,
        project,
        projectIssueFieldDefinition: updatedIssueFieldDefinition,
      });

    if (createExternalIssueFieldResult.isErr()) {
      return err(createExternalIssueFieldResult.error);
    }
    const { externalId, externalKey } = createExternalIssueFieldResult.value;

    await this.#projectIssueFieldDefinitionCrudService.update({
      ctx,
      payload: {
        id: updatedIssueFieldDefinition.id,
        integration: {
          externalId,
          externalKey,
          provider: project.props.integration.provider,
        },
      },
    });
    return ok();
  }

  async syncGitRepositories(
    input: z.infer<typeof projectSyncServiceInputSchema.syncGitRepositories>,
  ): Promise<Result<void, Err>> {
    const { ctx, payload } = input;
    const { projectId } = payload;

    const resolveResult = await this.#resolveProjectAndCredential(
      ctx,
      projectId,
    );

    if (resolveResult.isErr()) {
      return err(resolveResult.error);
    }
    const { project, credential } = resolveResult.value;

    if (isNil(project.props.integration)) {
      return ok();
    }
    const listGitRepositoriesResult = await this.#gitRepositoryCrudService.list(
      {
        ctx,
        filter: { projectId },
      },
    );

    if (listGitRepositoriesResult.isErr()) {
      return err(listGitRepositoriesResult.error);
    }
    const gitRepositories = listGitRepositoriesResult.value;

    const listIssueFieldDefinitionsResult =
      await this.#projectIssueFieldDefinitionCrudService.list({
        ctx,
        filter: { projectId, name: entityTypeToFieldName.gitRepository },
      });

    if (listIssueFieldDefinitionsResult.isErr()) {
      return err(listIssueFieldDefinitionsResult.error);
    }
    const issueFieldDefinition = listIssueFieldDefinitionsResult.value[0];

    if (isNil(issueFieldDefinition)) {
      const createIssueFieldDefinitionResult =
        await this.#projectIssueFieldDefinitionCrudService.create({
          ctx,
          payload: {
            type: entityTypeToFieldType.gitRepository,
            name: entityTypeToFieldName.gitRepository,
            options: gitRepositories.map((repo) => ({
              label: repo.props.name,
              value: repo.id,
            })),
            project: { id: projectId },
          },
        });

      if (createIssueFieldDefinitionResult.isErr()) {
        return err(createIssueFieldDefinitionResult.error);
      }
      const issueFieldDefinition = createIssueFieldDefinitionResult.value;

      const createExternalIssueFieldResult =
        await this.#externalProjectService.createCustomIssueField({
          ctx,
          credential,
          project,
          projectIssueFieldDefinition: issueFieldDefinition,
        });

      if (createExternalIssueFieldResult.isErr()) {
        return err(createExternalIssueFieldResult.error);
      }
      const { externalId, externalKey } = createExternalIssueFieldResult.value;

      await this.#projectIssueFieldDefinitionCrudService.update({
        ctx,
        payload: {
          id: issueFieldDefinition.id,
          integration: {
            externalId,
            externalKey,
            provider: project.props.integration.provider,
          },
        },
      });
      return ok();
    }

    const deleteExternalIssueFieldResult =
      await this.#externalProjectService.deleteCustomIssueField({
        ctx,
        credential,
        project,
        projectIssueFieldDefinition: issueFieldDefinition,
      });

    if (deleteExternalIssueFieldResult.isErr()) {
      return err(deleteExternalIssueFieldResult.error);
    }
    const updateIssueFieldDefinitionResult =
      await this.#projectIssueFieldDefinitionCrudService.update({
        ctx,
        payload: {
          id: issueFieldDefinition.id,
          options: gitRepositories.map((repo) => ({
            label: repo.props.name,
            value: repo.id,
          })),
        },
      });

    if (updateIssueFieldDefinitionResult.isErr()) {
      return err(updateIssueFieldDefinitionResult.error);
    }
    const updatedIssueFieldDefinition = updateIssueFieldDefinitionResult.value;

    const createExternalIssueFieldResult =
      await this.#externalProjectService.createCustomIssueField({
        ctx,
        credential,
        project,
        projectIssueFieldDefinition: updatedIssueFieldDefinition,
      });

    if (createExternalIssueFieldResult.isErr()) {
      return err(createExternalIssueFieldResult.error);
    }
    const { externalId, externalKey } = createExternalIssueFieldResult.value;

    await this.#projectIssueFieldDefinitionCrudService.update({
      ctx,
      payload: {
        id: updatedIssueFieldDefinition.id,
        integration: {
          externalId,
          externalKey,
          provider: project.props.integration.provider,
        },
      },
    });
    return ok();
  }

  async syncWorkflowDefinitions(
    input: z.infer<
      typeof projectSyncServiceInputSchema.syncWorkflowDefinitions
    >,
  ): Promise<Result<void, Err>> {
    const { ctx, payload } = input;
    const { projectId } = payload;

    const resolveResult = await this.#resolveProjectAndCredential(
      ctx,
      projectId,
    );

    if (resolveResult.isErr()) {
      return err(resolveResult.error);
    }
    const { project, credential } = resolveResult.value;

    if (isNil(project.props.integration)) {
      return ok();
    }
    const listWorkflowDefinitionsResult =
      await this.#workflowDefinitionCrudService.list({
        ctx,
        filter: { projectId },
      });

    if (listWorkflowDefinitionsResult.isErr()) {
      return err(listWorkflowDefinitionsResult.error);
    }
    const workflowDefinitions = listWorkflowDefinitionsResult.value;

    const listIssueFieldDefinitionsResult =
      await this.#projectIssueFieldDefinitionCrudService.list({
        ctx,
        filter: { projectId, name: entityTypeToFieldName.workflowDefinition },
      });

    if (listIssueFieldDefinitionsResult.isErr()) {
      return err(listIssueFieldDefinitionsResult.error);
    }
    const issueFieldDefinition = listIssueFieldDefinitionsResult.value[0];

    if (isNil(issueFieldDefinition)) {
      const createIssueFieldDefinitionResult =
        await this.#projectIssueFieldDefinitionCrudService.create({
          ctx,
          payload: {
            type: entityTypeToFieldType.workflowDefinition,
            name: entityTypeToFieldName.workflowDefinition,
            options: workflowDefinitions.map((def) => ({
              label: def.props.name,
              value: def.id,
            })),
            project: { id: projectId },
          },
        });

      if (createIssueFieldDefinitionResult.isErr()) {
        return err(createIssueFieldDefinitionResult.error);
      }
      const issueFieldDefinition = createIssueFieldDefinitionResult.value;

      const createExternalIssueFieldResult =
        await this.#externalProjectService.createCustomIssueField({
          ctx,
          credential,
          project,
          projectIssueFieldDefinition: issueFieldDefinition,
        });

      if (createExternalIssueFieldResult.isErr()) {
        return err(createExternalIssueFieldResult.error);
      }
      const { externalId, externalKey } = createExternalIssueFieldResult.value;

      await this.#projectIssueFieldDefinitionCrudService.update({
        ctx,
        payload: {
          id: issueFieldDefinition.id,
          integration: {
            externalId,
            externalKey,
            provider: project.props.integration.provider,
          },
        },
      });
      return ok();
    }

    const deleteExternalIssueFieldResult =
      await this.#externalProjectService.deleteCustomIssueField({
        ctx,
        credential,
        project,
        projectIssueFieldDefinition: issueFieldDefinition,
      });

    if (deleteExternalIssueFieldResult.isErr()) {
      return err(deleteExternalIssueFieldResult.error);
    }
    const updateIssueFieldDefinitionResult =
      await this.#projectIssueFieldDefinitionCrudService.update({
        ctx,
        payload: {
          id: issueFieldDefinition.id,
          options: workflowDefinitions.map((def) => ({
            label: def.props.name,
            value: def.id,
          })),
        },
      });

    if (updateIssueFieldDefinitionResult.isErr()) {
      return err(updateIssueFieldDefinitionResult.error);
    }
    const updatedIssueFieldDefinition = updateIssueFieldDefinitionResult.value;

    const createExternalIssueFieldResult =
      await this.#externalProjectService.createCustomIssueField({
        ctx,
        credential,
        project,
        projectIssueFieldDefinition: updatedIssueFieldDefinition,
      });

    if (createExternalIssueFieldResult.isErr()) {
      return err(createExternalIssueFieldResult.error);
    }
    const { externalId, externalKey } = createExternalIssueFieldResult.value;

    await this.#projectIssueFieldDefinitionCrudService.update({
      ctx,
      payload: {
        id: updatedIssueFieldDefinition.id,
        integration: {
          externalId,
          externalKey,
          provider: project.props.integration.provider,
        },
      },
    });
    return ok();
  }

  async #resolveProjectAndCredential(
    ctx: z.infer<typeof projectSyncServiceInputSchema.syncAiAgents>["ctx"],
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

    if (isNil(integration)) {
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
