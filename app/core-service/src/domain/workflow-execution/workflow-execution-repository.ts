import type { DomainError } from "@/domain/shared/errors";
import type { Result } from "@/domain/shared/result";
import type { Tenant } from "@/domain/shared/tenant";

import type { WorkflowDefinitionId } from "@/domain/workflow-definition/workflow-definition-id";
import type { WorkflowExecution } from "@/domain/workflow-execution/workflow-execution";
import type { WorkflowExecutionId } from "@/domain/workflow-execution/workflow-execution-id";

type WorkflowExecutionRepository = {
  findById(input: {
    id: WorkflowExecutionId;
    tenant: Tenant;
  }): Promise<Result<WorkflowExecution | null, DomainError>>;
  findMany(input: {
    tenant: Tenant;
    filter?: { workflowDefinitionId?: WorkflowDefinitionId };
  }): Promise<Result<readonly WorkflowExecution[], DomainError>>;
  save(aggregate: WorkflowExecution): Promise<Result<void, DomainError>>;
  delete(aggregate: WorkflowExecution): Promise<Result<void, DomainError>>;
};

export type { WorkflowExecutionRepository };
