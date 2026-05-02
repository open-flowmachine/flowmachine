import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";

const aiAgentRunStatuses = [
  "idle",
  "initializing",
  "initialized",
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

type AiAgentRunSandbox = {
  integration: {
    externalId: string;
    provider: AiAgentRunSandboxProvider;
  };
  status: AiAgentRunSandboxStatus;
};

type BaseAiAgentRun = Model<{
  aiAgentId: Id;
  sandbox: AiAgentRunSandbox | null;
  sessionId: string | null;
  status: AiAgentRunStatus;
}>;

type IdleAiAgentRun = BaseAiAgentRun & {
  status: "idle";
  sandbox: null;
};

type InitializingAiAgentRun = BaseAiAgentRun;

type InitializedAiAgentRun = BaseAiAgentRun & {
  status: "initialized";
  sandbox: AiAgentRunSandbox;
};

type StoppingAiAgentRun = BaseAiAgentRun & {
  status: "stopping";
  sandbox: AiAgentRunSandbox;
};

type StoppedAiAgentRun = BaseAiAgentRun & {
  status: "stopped";
  sandbox: AiAgentRunSandbox;
};

type FailedAiAgentRun = BaseAiAgentRun & {
  status: "stopped";
  sandbox: AiAgentRunSandbox | null;
};

type AiAgentRun =
  | IdleAiAgentRun
  | InitializingAiAgentRun
  | InitializedAiAgentRun
  | StoppingAiAgentRun
  | StoppedAiAgentRun
  | FailedAiAgentRun;

const isInitializedAiAgentRun = (
  aiAgentRun: AiAgentRun,
): aiAgentRun is InitializedAiAgentRun => aiAgentRun.status === "initialized";

export {
  aiAgentRunStatuses,
  aiAgentRunEndedReasons,
  aiAgentRunSandboxProviders,
  aiAgentRunSandboxStatuses,
  isInitializedAiAgentRun,
};
export type {
  AiAgentRun,
  AiAgentRunStatus,
  AiAgentRunEndedReason,
  AiAgentRunSandboxProvider,
  AiAgentRunSandboxStatus,
};
