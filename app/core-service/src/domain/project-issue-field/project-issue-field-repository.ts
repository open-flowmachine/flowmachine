import type { DomainError } from "@/domain/shared/errors";
import type { Result } from "@/domain/shared/result";
import type { Tenant } from "@/domain/shared/tenant";

import type { ProjectId } from "@/domain/project/project-id";
import type { ProjectIssueFieldDefinition } from "@/domain/project-issue-field/project-issue-field";
import type { ProjectIssueFieldDefinitionId } from "@/domain/project-issue-field/project-issue-field-id";

type ProjectIssueFieldDefinitionRepository = {
  findById(input: {
    id: ProjectIssueFieldDefinitionId;
    tenant: Tenant;
  }): Promise<Result<ProjectIssueFieldDefinition | null, DomainError>>;
  findMany(input: {
    tenant: Tenant;
    filter?: { projectId?: ProjectId; name?: string };
  }): Promise<Result<readonly ProjectIssueFieldDefinition[], DomainError>>;
  save(
    aggregate: ProjectIssueFieldDefinition,
  ): Promise<Result<void, DomainError>>;
  delete(
    aggregate: ProjectIssueFieldDefinition,
  ): Promise<Result<void, DomainError>>;
};

export type { ProjectIssueFieldDefinitionRepository };
