import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";

const aiAgentRunStatuses = [
  "idle",
  "initializing",
  "inProgress",
  "stopping",
  "stopped",
  "failed",
] as const;
type AiAgentRunStatus = (typeof aiAgentRunStatuses)[number];

const aiAgentRunEndedReasons = ["idleTimeout", "error"] as const;
type AiAgentRunEndedReason = (typeof aiAgentRunEndedReasons)[number];

const aiAgentRunSandboxProviders = ["daytona"] as const;
type AiAgentRunSandboxProvider = (typeof aiAgentRunSandboxProviders)[number];

const aiAgentRunSandboxStatuses = [
  "creating",
  "running",
  "failed",
  "stopping",
  "stopped",
] as const;
type AiAgentRunSandboxStatus = (typeof aiAgentRunSandboxStatuses)[number];

type AiAgentRun = Model<{
  aiAgentId: Id;
  sandbox: {
    integration: {
      externalId: string;
      provider: AiAgentRunSandboxProvider;
    };
    status: AiAgentRunSandboxStatus;
  } | null;
  sessionId: string | null;
  status: AiAgentRunStatus;
}>;

export {
  aiAgentRunStatuses,
  aiAgentRunEndedReasons,
  aiAgentRunSandboxProviders,
  aiAgentRunSandboxStatuses,
};
export type {
  AiAgentRun,
  AiAgentRunStatus,
  AiAgentRunEndedReason,
  AiAgentRunSandboxProvider,
  AiAgentRunSandboxStatus,
};
