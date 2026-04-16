import type { DomainEvent } from "@/domain/shared/domain-event";

import type { WorkflowDefinitionId } from "@/domain/workflow-definition/workflow-definition-id";
import type { WorkflowExecutionId } from "@/domain/workflow-execution/workflow-execution-id";
import type {
  ExecutionStatus,
  WorkflowDefinitionSnapshot,
  WorkflowExecutionIntegration,
} from "@/domain/workflow-execution/workflow-execution-value-objects";

type WorkflowExecutionTriggered = DomainEvent<
  "WorkflowExecutionTriggered",
  {
    readonly workflowExecutionId: WorkflowExecutionId;
    readonly workflowDefinitionId: WorkflowDefinitionId;
  }
>;

type WorkflowExecutionInitialized = DomainEvent<
  "WorkflowExecutionInitialized",
  {
    readonly workflowExecutionId: WorkflowExecutionId;
    readonly integration: WorkflowExecutionIntegration;
    readonly workflowDefinition: WorkflowDefinitionSnapshot;
  }
>;

type WorkflowExecutionStarted = DomainEvent<
  "WorkflowExecutionStarted",
  { readonly workflowExecutionId: WorkflowExecutionId }
>;

type WorkflowExecutionCompleted = DomainEvent<
  "WorkflowExecutionCompleted",
  {
    readonly workflowExecutionId: WorkflowExecutionId;
    readonly status: Extract<ExecutionStatus, "succeeded">;
  }
>;

type WorkflowExecutionFailed = DomainEvent<
  "WorkflowExecutionFailed",
  {
    readonly workflowExecutionId: WorkflowExecutionId;
    readonly reason: string;
  }
>;

type SandboxVolumeRequested = DomainEvent<
  "SandboxVolumeRequested",
  { readonly workflowExecutionId: WorkflowExecutionId }
>;

type SandboxVolumeReady = DomainEvent<
  "SandboxVolumeReady",
  { readonly workflowExecutionId: WorkflowExecutionId }
>;

type SandboxVolumeFailed = DomainEvent<
  "SandboxVolumeFailed",
  { readonly workflowExecutionId: WorkflowExecutionId }
>;

type SandboxAttached = DomainEvent<
  "SandboxAttached",
  {
    readonly workflowExecutionId: WorkflowExecutionId;
    readonly actionId: string;
    readonly externalId: string;
  }
>;

type SandboxReleased = DomainEvent<
  "SandboxReleased",
  {
    readonly workflowExecutionId: WorkflowExecutionId;
    readonly actionId: string;
  }
>;

type WorkflowExecutionEvent =
  | WorkflowExecutionTriggered
  | WorkflowExecutionInitialized
  | WorkflowExecutionStarted
  | WorkflowExecutionCompleted
  | WorkflowExecutionFailed
  | SandboxVolumeRequested
  | SandboxVolumeReady
  | SandboxVolumeFailed
  | SandboxAttached
  | SandboxReleased;

export type {
  SandboxAttached,
  SandboxReleased,
  SandboxVolumeFailed,
  SandboxVolumeReady,
  SandboxVolumeRequested,
  WorkflowExecutionCompleted,
  WorkflowExecutionEvent,
  WorkflowExecutionFailed,
  WorkflowExecutionInitialized,
  WorkflowExecutionStarted,
  WorkflowExecutionTriggered,
};
