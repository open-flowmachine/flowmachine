import type { Result } from "@/domain/shared/result";
import type { Tenant } from "@/domain/shared/tenant";

import type { WorkflowDefinitionId } from "@/domain/workflow-definition/workflow-definition-id";
import type { WorkflowExecution } from "@/domain/workflow-execution/workflow-execution";
import type { WorkflowExecutionId } from "@/domain/workflow-execution/workflow-execution-id";
import type {
  SandboxProvider,
  WorkflowDefinitionSnapshot,
  WorkflowExecutionIntegration,
} from "@/domain/workflow-execution/workflow-execution-value-objects";

import type { ApplicationError } from "@/application/shared/errors";

type TriggerWorkflowExecutionCommand = {
  tenant: Tenant;
  workflowDefinitionId: WorkflowDefinitionId;
};
type TriggerWorkflowExecutionOutput = { id: WorkflowExecutionId };
type TriggerWorkflowExecutionUseCase = {
  execute(
    command: TriggerWorkflowExecutionCommand,
  ): Promise<Result<TriggerWorkflowExecutionOutput, ApplicationError>>;
};

type InitializeWorkflowExecutionCommand = {
  tenant: Tenant;
  id: WorkflowExecutionId;
  integration: WorkflowExecutionIntegration;
  workflowDefinition: WorkflowDefinitionSnapshot;
};
type InitializeWorkflowExecutionUseCase = {
  execute(
    command: InitializeWorkflowExecutionCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type StartWorkflowExecutionCommand = {
  tenant: Tenant;
  id: WorkflowExecutionId;
};
type StartWorkflowExecutionUseCase = {
  execute(
    command: StartWorkflowExecutionCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type GetWorkflowExecutionCommand = {
  tenant: Tenant;
  id: WorkflowExecutionId;
};
type GetWorkflowExecutionOutput = {
  workflowExecution: WorkflowExecution;
};
type GetWorkflowExecutionUseCase = {
  execute(
    command: GetWorkflowExecutionCommand,
  ): Promise<Result<GetWorkflowExecutionOutput, ApplicationError>>;
};

type ListWorkflowExecutionsCommand = {
  tenant: Tenant;
  filter?: { workflowDefinitionId?: WorkflowDefinitionId };
};
type ListWorkflowExecutionsOutput = {
  workflowExecutions: readonly WorkflowExecution[];
};
type ListWorkflowExecutionsUseCase = {
  execute(
    command: ListWorkflowExecutionsCommand,
  ): Promise<Result<ListWorkflowExecutionsOutput, ApplicationError>>;
};

type RequestSandboxVolumeCommand = {
  tenant: Tenant;
  id: WorkflowExecutionId;
  provider: SandboxProvider;
  externalId: string;
};
type RequestSandboxVolumeUseCase = {
  execute(
    command: RequestSandboxVolumeCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type MarkSandboxVolumeReadyCommand = {
  tenant: Tenant;
  id: WorkflowExecutionId;
};
type MarkSandboxVolumeReadyUseCase = {
  execute(
    command: MarkSandboxVolumeReadyCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type AttachSandboxCommand = {
  tenant: Tenant;
  id: WorkflowExecutionId;
  provider: SandboxProvider;
  externalId: string;
  actionId: string;
};
type AttachSandboxUseCase = {
  execute(
    command: AttachSandboxCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type ReleaseSandboxCommand = {
  tenant: Tenant;
  id: WorkflowExecutionId;
};
type ReleaseSandboxUseCase = {
  execute(
    command: ReleaseSandboxCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type CompleteWorkflowExecutionCommand = {
  tenant: Tenant;
  id: WorkflowExecutionId;
};
type CompleteWorkflowExecutionUseCase = {
  execute(
    command: CompleteWorkflowExecutionCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type FailWorkflowExecutionCommand = {
  tenant: Tenant;
  id: WorkflowExecutionId;
  reason: string;
};
type FailWorkflowExecutionUseCase = {
  execute(
    command: FailWorkflowExecutionCommand,
  ): Promise<Result<void, ApplicationError>>;
};

export type {
  AttachSandboxCommand,
  AttachSandboxUseCase,
  CompleteWorkflowExecutionCommand,
  CompleteWorkflowExecutionUseCase,
  FailWorkflowExecutionCommand,
  FailWorkflowExecutionUseCase,
  GetWorkflowExecutionCommand,
  GetWorkflowExecutionOutput,
  GetWorkflowExecutionUseCase,
  InitializeWorkflowExecutionCommand,
  InitializeWorkflowExecutionUseCase,
  ListWorkflowExecutionsCommand,
  ListWorkflowExecutionsOutput,
  ListWorkflowExecutionsUseCase,
  MarkSandboxVolumeReadyCommand,
  MarkSandboxVolumeReadyUseCase,
  ReleaseSandboxCommand,
  ReleaseSandboxUseCase,
  RequestSandboxVolumeCommand,
  RequestSandboxVolumeUseCase,
  StartWorkflowExecutionCommand,
  StartWorkflowExecutionUseCase,
  TriggerWorkflowExecutionCommand,
  TriggerWorkflowExecutionOutput,
  TriggerWorkflowExecutionUseCase,
};
