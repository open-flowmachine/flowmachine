import type { DomainError } from "@/domain/shared/errors";
import type { Result } from "@/domain/shared/result";
import type { Tenant } from "@/domain/shared/tenant";

import type { ProjectId } from "@/domain/project/project-id";
import type { WorkflowDefinition } from "@/domain/workflow-definition/workflow-definition";
import type { WorkflowDefinitionId } from "@/domain/workflow-definition/workflow-definition-id";

type WorkflowDefinitionRepository = {
  findById(input: {
    id: WorkflowDefinitionId;
    tenant: Tenant;
  }): Promise<Result<WorkflowDefinition | null, DomainError>>;
  findMany(input: {
    tenant: Tenant;
    filter?: { projectId?: ProjectId };
  }): Promise<Result<readonly WorkflowDefinition[], DomainError>>;
  save(aggregate: WorkflowDefinition): Promise<Result<void, DomainError>>;
  delete(aggregate: WorkflowDefinition): Promise<Result<void, DomainError>>;
};

export type { WorkflowDefinitionRepository };
