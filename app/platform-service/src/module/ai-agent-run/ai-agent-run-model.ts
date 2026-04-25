import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";

const aiAgentRunStatuses = [
  "provisioning",
  "idle",
  "processing",
  "errored",
  "stopped",
] as const;
type AiAgentRunStatus = (typeof aiAgentRunStatuses)[number];

const aiAgentRunEndedReasons = [
  "user_stop",
  "idle_timeout",
  "error",
] as const;
type AiAgentRunEndedReason = (typeof aiAgentRunEndedReasons)[number];

const aiAgentRunSandboxProviders = ["daytona"] as const;
type AiAgentRunSandboxProvider = (typeof aiAgentRunSandboxProviders)[number];

const aiAgentRunVolumeStatuses = [
  "creating",
  "ready",
  "failed",
  "destroying",
  "destroyed",
] as const;
type AiAgentRunVolumeStatus = (typeof aiAgentRunVolumeStatuses)[number];

const aiAgentRunSandboxStatuses = [
  "creating",
  "running",
  "failed",
  "destroying",
  "destroyed",
] as const;
type AiAgentRunSandboxStatus = (typeof aiAgentRunSandboxStatuses)[number];

type AiAgentRunSandbox = {
  volume: {
    integration: {
      externalId: string;
      provider: AiAgentRunSandboxProvider;
    };
    status: AiAgentRunVolumeStatus;
  };
  currentSandbox: {
    integration: {
      externalId: string;
      provider: AiAgentRunSandboxProvider;
    };
    status: AiAgentRunSandboxStatus;
  } | null;
};

type AiAgentRun = Model<{
  aiAgentId: Id;
  status: AiAgentRunStatus;
  sessionId: string | null;
  sandbox: AiAgentRunSandbox | null;
  startedAt: Date;
  lastMessageAt: Date | null;
  endedAt: Date | null;
  endedReason: AiAgentRunEndedReason | null;
}>;

const aiAgentRunTerminalStatuses = [
  "stopped",
  "errored",
] as const satisfies AiAgentRunStatus[];

export {
  aiAgentRunStatuses,
  aiAgentRunEndedReasons,
  aiAgentRunSandboxProviders,
  aiAgentRunVolumeStatuses,
  aiAgentRunSandboxStatuses,
  aiAgentRunTerminalStatuses,
};
export type {
  AiAgentRun,
  AiAgentRunStatus,
  AiAgentRunEndedReason,
  AiAgentRunSandbox,
  AiAgentRunSandboxProvider,
  AiAgentRunSandboxStatus,
  AiAgentRunVolumeStatus,
};
