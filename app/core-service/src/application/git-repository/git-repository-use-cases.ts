import type { Result } from "@/domain/shared/result";
import type { Tenant } from "@/domain/shared/tenant";

import type { CredentialId } from "@/domain/credential/credential-id";
import type { GitRepository } from "@/domain/git-repository/git-repository";
import type { GitRepositoryId } from "@/domain/git-repository/git-repository-id";
import type {
  GitRepositoryConfig,
  GitRepositoryIntegration,
} from "@/domain/git-repository/git-repository-value-objects";
import type { ProjectId } from "@/domain/project/project-id";

import type { ApplicationError } from "@/application/shared/errors";

type CreateGitRepositoryCommand = {
  tenant: Tenant;
  name: string;
  url: string;
  config: GitRepositoryConfig;
  integration: GitRepositoryIntegration;
  projectIds?: readonly ProjectId[];
};
type CreateGitRepositoryOutput = { id: GitRepositoryId };
type CreateGitRepositoryUseCase = {
  execute(
    command: CreateGitRepositoryCommand,
  ): Promise<Result<CreateGitRepositoryOutput, ApplicationError>>;
};

type GetGitRepositoryCommand = { tenant: Tenant; id: GitRepositoryId };
type GetGitRepositoryOutput = { gitRepository: GitRepository };
type GetGitRepositoryUseCase = {
  execute(
    command: GetGitRepositoryCommand,
  ): Promise<Result<GetGitRepositoryOutput, ApplicationError>>;
};

type ListGitRepositoriesCommand = {
  tenant: Tenant;
  filter?: { projectId?: ProjectId };
};
type ListGitRepositoriesOutput = {
  gitRepositories: readonly GitRepository[];
};
type ListGitRepositoriesUseCase = {
  execute(
    command: ListGitRepositoriesCommand,
  ): Promise<Result<ListGitRepositoriesOutput, ApplicationError>>;
};

type UpdateGitRepositoryConfigCommand = {
  tenant: Tenant;
  id: GitRepositoryId;
  config: GitRepositoryConfig;
};
type UpdateGitRepositoryConfigUseCase = {
  execute(
    command: UpdateGitRepositoryConfigCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type RotateGitRepositoryCredentialCommand = {
  tenant: Tenant;
  id: GitRepositoryId;
  credentialId: CredentialId;
};
type RotateGitRepositoryCredentialUseCase = {
  execute(
    command: RotateGitRepositoryCredentialCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type LinkGitRepositoryToProjectCommand = {
  tenant: Tenant;
  id: GitRepositoryId;
  projectId: ProjectId;
};
type LinkGitRepositoryToProjectUseCase = {
  execute(
    command: LinkGitRepositoryToProjectCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type UnlinkGitRepositoryFromProjectCommand = {
  tenant: Tenant;
  id: GitRepositoryId;
  projectId: ProjectId;
};
type UnlinkGitRepositoryFromProjectUseCase = {
  execute(
    command: UnlinkGitRepositoryFromProjectCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type DeleteGitRepositoryCommand = { tenant: Tenant; id: GitRepositoryId };
type DeleteGitRepositoryUseCase = {
  execute(
    command: DeleteGitRepositoryCommand,
  ): Promise<Result<void, ApplicationError>>;
};

export type {
  CreateGitRepositoryCommand,
  CreateGitRepositoryOutput,
  CreateGitRepositoryUseCase,
  DeleteGitRepositoryCommand,
  DeleteGitRepositoryUseCase,
  GetGitRepositoryCommand,
  GetGitRepositoryOutput,
  GetGitRepositoryUseCase,
  LinkGitRepositoryToProjectCommand,
  LinkGitRepositoryToProjectUseCase,
  ListGitRepositoriesCommand,
  ListGitRepositoriesOutput,
  ListGitRepositoriesUseCase,
  RotateGitRepositoryCredentialCommand,
  RotateGitRepositoryCredentialUseCase,
  UnlinkGitRepositoryFromProjectCommand,
  UnlinkGitRepositoryFromProjectUseCase,
  UpdateGitRepositoryConfigCommand,
  UpdateGitRepositoryConfigUseCase,
};
