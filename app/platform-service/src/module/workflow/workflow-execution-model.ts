import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";

const workflowProvider = ["inngest"] as const;
type WorkflowProvider = (typeof workflowProvider)[number];

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

type WorkflowExecutionSandbox = {
  volume: {
    integration: {
      externalId: string;
      provider: SandboxProvider;
    };
    status: VolumeStatus;
  };
  currentSandbox: {
    integration: {
      externalId: string;
      provider: SandboxProvider;
    };
    status: SandboxStatus;
    actionId: string;
  } | null;
};

type WorkflowExecution = Model<{
  integration: {
    externalId: string;
    provider: WorkflowProvider;
  };
  workflowDefinition: {
    id: Id;
    raw: Record<string, unknown>;
  };
  sandbox?: WorkflowExecutionSandbox;
}>;

export { sandboxProviders, sandboxStatuses, volumeStatuses };
export type {
  SandboxProvider,
  SandboxStatus,
  VolumeStatus,
  WorkflowExecution,
  WorkflowExecutionSandbox,
};
