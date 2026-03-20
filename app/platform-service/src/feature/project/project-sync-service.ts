import { isNil } from "es-toolkit";
import { err, ok } from "neverthrow";
import type { Result } from "neverthrow";

import type { makeAiAgentService } from "@/module/ai-agent/ai-agent-service";
import type { Credential } from "@/module/credential/credential-model";
import type { makeCredentialService } from "@/module/credential/credential-service";
import type { makeGitRepositoryService } from "@/module/git-repository/git-repository-service";
import type { ProjectIssueFieldDefinition } from "@/module/project/project-issue-field-definition-model";
import type { makeProjectIssueFieldDefinitionService } from "@/module/project/project-issue-field-definition-service";
import type { Project } from "@/module/project/project-model";
import type { makeProjectService } from "@/module/project/project-service";
import type { makeWorkflowDefinitionService } from "@/module/workflow/workflow-definition-service";
import { Err } from "@/shared/err/err";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

type ExternalProjectService = {
  createCustomIssueField: (input: {
    credential: Credential;
    project: Project;
    projectIssueFieldDefinition: ProjectIssueFieldDefinition;
  }) => Promise<Result<{ externalId: string; externalKey: string }, Err>>;
  deleteCustomIssueField: (input: {
    credential: Credential;
    project: Project;
    projectIssueFieldDefinition: ProjectIssueFieldDefinition;
  }) => Promise<Result<void, Err>>;
};

type Deps = {
  projectService: ReturnType<typeof makeProjectService>;
  credentialService: ReturnType<typeof makeCredentialService>;
  aiAgentService: ReturnType<typeof makeAiAgentService>;
  gitRepositoryService: ReturnType<typeof makeGitRepositoryService>;
  workflowDefinitionService: ReturnType<typeof makeWorkflowDefinitionService>;
  projectIssueFieldDefinitionService: ReturnType<
    typeof makeProjectIssueFieldDefinitionService
  >;
  externalProjectService: ExternalProjectService;
};

type SyncInput = {
  ctx: { tenant: Tenant };
  payload: { projectId: Id };
};

const entityTypeToFieldName = {
  aiAgent: "AI Agent",
  gitRepository: "Git Repository",
  workflowDefinition: "Workflow Definition",
} as const satisfies Record<string, string>;

const entityTypeToFieldType = {
  aiAgent: "select",
  gitRepository: "select",
  workflowDefinition: "select",
} as const satisfies Record<string, ProjectIssueFieldDefinition["type"]>;

const resolveProjectAndCredential = async (
  ctx: SyncInput["ctx"],
  projectId: Id,
  deps: Pick<Deps, "projectService" | "credentialService">,
): Promise<
  Result<
    {
      project: Project & {
        integration: NonNullable<Project["integration"]>;
      };
      credential: Credential;
    },
    Err
  >
> => {
  const projectResult = await deps.projectService.get({ ctx, id: projectId });

  if (projectResult.isErr()) {
    return err(projectResult.error);
  }
  const project = projectResult.value.data;

  const integration = project.integration;

  if (isNil(integration)) {
    return err(
      Err.code("badRequest", {
        message: "Project has no integration configured",
      }),
    );
  }

  const credentialResult = await deps.credentialService.get({
    ctx,
    id: integration.credentialId,
  });

  if (credentialResult.isErr()) {
    return err(credentialResult.error);
  }
  const credential = credentialResult.value.data;

  return ok({
    project: { ...project, integration },
    credential,
  });
};

const createAndSyncNewField = async (
  input: {
    ctx: SyncInput["ctx"];
    fieldName: string;
    fieldType: ProjectIssueFieldDefinition["type"];
    options: ProjectIssueFieldDefinition["options"];
    projectId: Id;
    project: Project & {
      integration: NonNullable<Project["integration"]>;
    };
    credential: Credential;
  },
  deps: Pick<Deps, "projectIssueFieldDefinitionService" | "externalProjectService">,
): Promise<Result<void, Err>> => {
  const { ctx, fieldName, fieldType, options, projectId, project, credential } =
    input;

  const createResult =
    await deps.projectIssueFieldDefinitionService.create({
      ctx,
      payload: {
        type: fieldType,
        name: fieldName,
        options,
        integration: null,
        project: { id: projectId },
      },
    });

  if (createResult.isErr()) {
    return err(createResult.error);
  }

  const getResult = await deps.projectIssueFieldDefinitionService.get({
    ctx,
    id: createResult.value.id,
  });

  if (getResult.isErr()) {
    return err(getResult.error);
  }
  const createdDefinition = getResult.value.data;

  const externalResult =
    await deps.externalProjectService.createCustomIssueField({
      credential,
      project,
      projectIssueFieldDefinition: createdDefinition,
    });

  if (externalResult.isErr()) {
    return err(externalResult.error);
  }
  const { externalId, externalKey } = externalResult.value;

  const updateResult =
    await deps.projectIssueFieldDefinitionService.update({
      ctx,
      id: createdDefinition.id,
      data: {
        integration: {
          externalId,
          externalKey,
          provider: project.integration.provider,
        },
      },
    });

  if (updateResult.isErr()) {
    return err(updateResult.error);
  }
  return ok();
};

const updateAndSyncExistingField = async (
  input: {
    ctx: SyncInput["ctx"];
    issueFieldDefinition: ProjectIssueFieldDefinition;
    options: ProjectIssueFieldDefinition["options"];
    project: Project & {
      integration: NonNullable<Project["integration"]>;
    };
    credential: Credential;
  },
  deps: Pick<Deps, "projectIssueFieldDefinitionService" | "externalProjectService">,
): Promise<Result<void, Err>> => {
  const { ctx, issueFieldDefinition, options, project, credential } = input;

  const deleteResult =
    await deps.externalProjectService.deleteCustomIssueField({
      credential,
      project,
      projectIssueFieldDefinition: issueFieldDefinition,
    });

  if (deleteResult.isErr()) {
    return err(deleteResult.error);
  }

  const updateResult =
    await deps.projectIssueFieldDefinitionService.update({
      ctx,
      id: issueFieldDefinition.id,
      data: { options },
    });

  if (updateResult.isErr()) {
    return err(updateResult.error);
  }
  if (isNil(updateResult.value.data)) {
    return err(Err.code("notFound"));
  }
  const updatedDefinition = updateResult.value.data;

  const externalResult =
    await deps.externalProjectService.createCustomIssueField({
      credential,
      project,
      projectIssueFieldDefinition: updatedDefinition,
    });

  if (externalResult.isErr()) {
    return err(externalResult.error);
  }
  const { externalId, externalKey } = externalResult.value;

  const finalUpdateResult =
    await deps.projectIssueFieldDefinitionService.update({
      ctx,
      id: updatedDefinition.id,
      data: {
        integration: {
          externalId,
          externalKey,
          provider: project.integration.provider,
        },
      },
    });

  if (finalUpdateResult.isErr()) {
    return err(finalUpdateResult.error);
  }
  return ok();
};

const makeProjectSyncService = (deps: Deps) => {
  const syncAiAgentToExternal = async (
    input: SyncInput,
  ): Promise<Result<void, Err>> => {
    const { ctx, payload } = input;
    const { projectId } = payload;

    const resolveResult = await resolveProjectAndCredential(
      ctx,
      projectId,
      deps,
    );

    if (resolveResult.isErr()) {
      return err(resolveResult.error);
    }
    const { project, credential } = resolveResult.value;

    const listResult = await deps.aiAgentService.list({
      ctx,
      filter: { projectId },
    });

    if (listResult.isErr()) {
      return err(listResult.error);
    }
    const aiAgents = listResult.value.data;

    const listFieldsResult =
      await deps.projectIssueFieldDefinitionService.list({
        ctx,
        filter: { projectId, name: entityTypeToFieldName.aiAgent },
      });

    if (listFieldsResult.isErr()) {
      return err(listFieldsResult.error);
    }
    const issueFieldDefinition = listFieldsResult.value.data[0];

    const options = aiAgents.map((agent) => ({
      label: agent.name,
      value: agent.id,
    }));

    if (isNil(issueFieldDefinition)) {
      return createAndSyncNewField(
        {
          ctx,
          fieldName: entityTypeToFieldName.aiAgent,
          fieldType: entityTypeToFieldType.aiAgent,
          options,
          projectId,
          project,
          credential,
        },
        deps,
      );
    }

    return updateAndSyncExistingField(
      { ctx, issueFieldDefinition, options, project, credential },
      deps,
    );
  };

  const syncGitRepositoryToExternal = async (
    input: SyncInput,
  ): Promise<Result<void, Err>> => {
    const { ctx, payload } = input;
    const { projectId } = payload;

    const resolveResult = await resolveProjectAndCredential(
      ctx,
      projectId,
      deps,
    );

    if (resolveResult.isErr()) {
      return err(resolveResult.error);
    }
    const { project, credential } = resolveResult.value;

    const listResult = await deps.gitRepositoryService.list({
      ctx,
      filter: { projectId },
    });

    if (listResult.isErr()) {
      return err(listResult.error);
    }
    const gitRepositories = listResult.value.data;

    const listFieldsResult =
      await deps.projectIssueFieldDefinitionService.list({
        ctx,
        filter: { projectId, name: entityTypeToFieldName.gitRepository },
      });

    if (listFieldsResult.isErr()) {
      return err(listFieldsResult.error);
    }
    const issueFieldDefinition = listFieldsResult.value.data[0];

    const options = gitRepositories.map((repo) => ({
      label: repo.name,
      value: repo.id,
    }));

    if (isNil(issueFieldDefinition)) {
      return createAndSyncNewField(
        {
          ctx,
          fieldName: entityTypeToFieldName.gitRepository,
          fieldType: entityTypeToFieldType.gitRepository,
          options,
          projectId,
          project,
          credential,
        },
        deps,
      );
    }

    return updateAndSyncExistingField(
      { ctx, issueFieldDefinition, options, project, credential },
      deps,
    );
  };

  const syncWorkflowDefinitionToExternal = async (
    input: SyncInput,
  ): Promise<Result<void, Err>> => {
    const { ctx, payload } = input;
    const { projectId } = payload;

    const resolveResult = await resolveProjectAndCredential(
      ctx,
      projectId,
      deps,
    );

    if (resolveResult.isErr()) {
      return err(resolveResult.error);
    }
    const { project, credential } = resolveResult.value;

    const listResult = await deps.workflowDefinitionService.list({
      ctx,
      filter: { projectId },
    });

    if (listResult.isErr()) {
      return err(listResult.error);
    }
    const workflowDefinitions = listResult.value.data;

    const listFieldsResult =
      await deps.projectIssueFieldDefinitionService.list({
        ctx,
        filter: {
          projectId,
          name: entityTypeToFieldName.workflowDefinition,
        },
      });

    if (listFieldsResult.isErr()) {
      return err(listFieldsResult.error);
    }
    const issueFieldDefinition = listFieldsResult.value.data[0];

    const options = workflowDefinitions.map((def) => ({
      label: def.name,
      value: def.id,
    }));

    if (isNil(issueFieldDefinition)) {
      return createAndSyncNewField(
        {
          ctx,
          fieldName: entityTypeToFieldName.workflowDefinition,
          fieldType: entityTypeToFieldType.workflowDefinition,
          options,
          projectId,
          project,
          credential,
        },
        deps,
      );
    }

    return updateAndSyncExistingField(
      { ctx, issueFieldDefinition, options, project, credential },
      deps,
    );
  };

  return {
    syncAiAgentToExternal,
    syncGitRepositoryToExternal,
    syncWorkflowDefinitionToExternal,
  };
};

export { makeProjectSyncService };
export type { ExternalProjectService };
