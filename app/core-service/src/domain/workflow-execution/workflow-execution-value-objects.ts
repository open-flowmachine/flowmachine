import type { WorkflowDefinitionId } from "@/domain/workflow-definition/workflow-definition-id";

const workflowProviders = ["inngest"] as const;
type WorkflowProvider = (typeof workflowProviders)[number];

const sandboxProviders = ["daytona"] as const;
type SandboxProvider = (typeof sandboxProviders)[number];

const volumeStatuses = [
  "creating",
  "ready",
  "failed",
  "destroying",
  "destroyed",
] as const;
type VolumeStatus = (typeof volumeStatuses)[number];

const sandboxStatuses = [
  "creating",
  "running",
  "failed",
  "destroying",
  "destroyed",
] as const;
type SandboxStatus = (typeof sandboxStatuses)[number];

const executionStatuses = [
  "initialized",
  "running",
  "succeeded",
  "failed",
  "cancelled",
] as const;
type ExecutionStatus = (typeof executionStatuses)[number];

type WorkflowExecutionIntegration = {
  readonly externalId: string;
  readonly provider: WorkflowProvider;
};

type WorkflowDefinitionSnapshot = {
  readonly id: WorkflowDefinitionId;
  readonly raw: Readonly<Record<string, unknown>>;
};

type Volume = {
  readonly integration: {
    readonly externalId: string;
    readonly provider: SandboxProvider;
  };
  readonly status: VolumeStatus;
};

type CurrentSandbox = {
  readonly integration: {
    readonly externalId: string;
    readonly provider: SandboxProvider;
  };
  readonly status: SandboxStatus;
  readonly actionId: string;
};

type WorkflowExecutionSandbox = {
  readonly volume: Volume;
  readonly currentSandbox: CurrentSandbox | null;
};

export {
  executionStatuses,
  sandboxProviders,
  sandboxStatuses,
  volumeStatuses,
  workflowProviders,
};
export type {
  CurrentSandbox,
  ExecutionStatus,
  SandboxProvider,
  SandboxStatus,
  Volume,
  VolumeStatus,
  WorkflowDefinitionSnapshot,
  WorkflowExecutionIntegration,
  WorkflowExecutionSandbox,
  WorkflowProvider,
};
