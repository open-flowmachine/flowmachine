import type { Result } from "@/domain/shared/result";
import type { Tenant } from "@/domain/shared/tenant";

import type { Project } from "@/domain/project/project";
import type { ProjectId } from "@/domain/project/project-id";
import type { ProjectIntegration } from "@/domain/project/project-value-objects";

import type { ApplicationError } from "@/application/shared/errors";

type CreateProjectCommand = {
  tenant: Tenant;
  name: string;
  integration: ProjectIntegration | null;
};
type CreateProjectOutput = { id: ProjectId };
type CreateProjectUseCase = {
  execute(
    command: CreateProjectCommand,
  ): Promise<Result<CreateProjectOutput, ApplicationError>>;
};

type GetProjectCommand = { tenant: Tenant; id: ProjectId };
type GetProjectOutput = { project: Project };
type GetProjectUseCase = {
  execute(
    command: GetProjectCommand,
  ): Promise<Result<GetProjectOutput, ApplicationError>>;
};

type ListProjectsCommand = { tenant: Tenant };
type ListProjectsOutput = { projects: readonly Project[] };
type ListProjectsUseCase = {
  execute(
    command: ListProjectsCommand,
  ): Promise<Result<ListProjectsOutput, ApplicationError>>;
};

type RenameProjectCommand = { tenant: Tenant; id: ProjectId; name: string };
type RenameProjectUseCase = {
  execute(
    command: RenameProjectCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type ConfigureProjectIntegrationCommand = {
  tenant: Tenant;
  id: ProjectId;
  integration: ProjectIntegration;
};
type ConfigureProjectIntegrationUseCase = {
  execute(
    command: ConfigureProjectIntegrationCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type RemoveProjectIntegrationCommand = { tenant: Tenant; id: ProjectId };
type RemoveProjectIntegrationUseCase = {
  execute(
    command: RemoveProjectIntegrationCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type DeleteProjectCommand = { tenant: Tenant; id: ProjectId };
type DeleteProjectUseCase = {
  execute(
    command: DeleteProjectCommand,
  ): Promise<Result<void, ApplicationError>>;
};

export type {
  ConfigureProjectIntegrationCommand,
  ConfigureProjectIntegrationUseCase,
  CreateProjectCommand,
  CreateProjectOutput,
  CreateProjectUseCase,
  DeleteProjectCommand,
  DeleteProjectUseCase,
  GetProjectCommand,
  GetProjectOutput,
  GetProjectUseCase,
  ListProjectsCommand,
  ListProjectsOutput,
  ListProjectsUseCase,
  RemoveProjectIntegrationCommand,
  RemoveProjectIntegrationUseCase,
  RenameProjectCommand,
  RenameProjectUseCase,
};
