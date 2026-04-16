import type { Result } from "@/domain/shared/result";
import type { Tenant } from "@/domain/shared/tenant";

import type { ProjectId } from "@/domain/project/project-id";

import type { ApplicationError } from "@/application/shared/errors";

type SyncAiAgentsToExternalProviderCommand = {
  tenant: Tenant;
  projectId: ProjectId;
};
type SyncAiAgentsToExternalProviderUseCase = {
  execute(
    command: SyncAiAgentsToExternalProviderCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type SyncGitRepositoriesToExternalProviderCommand = {
  tenant: Tenant;
  projectId: ProjectId;
};
type SyncGitRepositoriesToExternalProviderUseCase = {
  execute(
    command: SyncGitRepositoriesToExternalProviderCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type SyncWorkflowDefinitionsToExternalProviderCommand = {
  tenant: Tenant;
  projectId: ProjectId;
};
type SyncWorkflowDefinitionsToExternalProviderUseCase = {
  execute(
    command: SyncWorkflowDefinitionsToExternalProviderCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type SyncProjectCommand = { tenant: Tenant; projectId: ProjectId };
type SyncProjectUseCase = {
  execute(
    command: SyncProjectCommand,
  ): Promise<Result<void, ApplicationError>>;
};

export type {
  SyncAiAgentsToExternalProviderCommand,
  SyncAiAgentsToExternalProviderUseCase,
  SyncGitRepositoriesToExternalProviderCommand,
  SyncGitRepositoriesToExternalProviderUseCase,
  SyncProjectCommand,
  SyncProjectUseCase,
  SyncWorkflowDefinitionsToExternalProviderCommand,
  SyncWorkflowDefinitionsToExternalProviderUseCase,
};
