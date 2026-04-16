import type { Result } from "@/domain/shared/result";
import type { Tenant } from "@/domain/shared/tenant";

import type { ProjectId } from "@/domain/project/project-id";
import type { ProjectIssueFieldDefinition } from "@/domain/project-issue-field/project-issue-field";
import type { ProjectIssueFieldDefinitionId } from "@/domain/project-issue-field/project-issue-field-id";
import type {
  IssueFieldIntegration,
  IssueFieldOption,
  IssueFieldType,
} from "@/domain/project-issue-field/project-issue-field-value-objects";

import type { ApplicationError } from "@/application/shared/errors";

type CreateIssueFieldDefinitionCommand = {
  tenant: Tenant;
  projectId: ProjectId;
  name: string;
  type: IssueFieldType;
  options: readonly IssueFieldOption[];
  integration: IssueFieldIntegration | null;
};
type CreateIssueFieldDefinitionOutput = {
  id: ProjectIssueFieldDefinitionId;
};
type CreateIssueFieldDefinitionUseCase = {
  execute(
    command: CreateIssueFieldDefinitionCommand,
  ): Promise<Result<CreateIssueFieldDefinitionOutput, ApplicationError>>;
};

type GetIssueFieldDefinitionCommand = {
  tenant: Tenant;
  id: ProjectIssueFieldDefinitionId;
};
type GetIssueFieldDefinitionOutput = {
  issueFieldDefinition: ProjectIssueFieldDefinition;
};
type GetIssueFieldDefinitionUseCase = {
  execute(
    command: GetIssueFieldDefinitionCommand,
  ): Promise<Result<GetIssueFieldDefinitionOutput, ApplicationError>>;
};

type ListIssueFieldDefinitionsCommand = {
  tenant: Tenant;
  filter?: { projectId?: ProjectId; name?: string };
};
type ListIssueFieldDefinitionsOutput = {
  issueFieldDefinitions: readonly ProjectIssueFieldDefinition[];
};
type ListIssueFieldDefinitionsUseCase = {
  execute(
    command: ListIssueFieldDefinitionsCommand,
  ): Promise<Result<ListIssueFieldDefinitionsOutput, ApplicationError>>;
};

type UpdateIssueFieldOptionsCommand = {
  tenant: Tenant;
  id: ProjectIssueFieldDefinitionId;
  options: readonly IssueFieldOption[];
};
type UpdateIssueFieldOptionsUseCase = {
  execute(
    command: UpdateIssueFieldOptionsCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type LinkIssueFieldToExternalProviderCommand = {
  tenant: Tenant;
  id: ProjectIssueFieldDefinitionId;
  integration: IssueFieldIntegration;
};
type LinkIssueFieldToExternalProviderUseCase = {
  execute(
    command: LinkIssueFieldToExternalProviderCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type UnlinkIssueFieldFromExternalProviderCommand = {
  tenant: Tenant;
  id: ProjectIssueFieldDefinitionId;
};
type UnlinkIssueFieldFromExternalProviderUseCase = {
  execute(
    command: UnlinkIssueFieldFromExternalProviderCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type DeleteIssueFieldDefinitionCommand = {
  tenant: Tenant;
  id: ProjectIssueFieldDefinitionId;
};
type DeleteIssueFieldDefinitionUseCase = {
  execute(
    command: DeleteIssueFieldDefinitionCommand,
  ): Promise<Result<void, ApplicationError>>;
};

export type {
  CreateIssueFieldDefinitionCommand,
  CreateIssueFieldDefinitionOutput,
  CreateIssueFieldDefinitionUseCase,
  DeleteIssueFieldDefinitionCommand,
  DeleteIssueFieldDefinitionUseCase,
  GetIssueFieldDefinitionCommand,
  GetIssueFieldDefinitionOutput,
  GetIssueFieldDefinitionUseCase,
  LinkIssueFieldToExternalProviderCommand,
  LinkIssueFieldToExternalProviderUseCase,
  ListIssueFieldDefinitionsCommand,
  ListIssueFieldDefinitionsOutput,
  ListIssueFieldDefinitionsUseCase,
  UnlinkIssueFieldFromExternalProviderCommand,
  UnlinkIssueFieldFromExternalProviderUseCase,
  UpdateIssueFieldOptionsCommand,
  UpdateIssueFieldOptionsUseCase,
};
