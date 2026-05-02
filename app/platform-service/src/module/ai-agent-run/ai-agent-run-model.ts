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

const aiAgentRunSandboxProviders = ["daytona"] as const;
type AiAgentRunSandboxProvider = (typeof aiAgentRunSandboxProviders)[number];

type AiAgentRunSandbox = {
  integration: {
    externalId: string;
    provider: AiAgentRunSandboxProvider;
  };
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
  aiAgentRunSandboxProviders,
  isInitializedAiAgentRun,
};
export type { AiAgentRun, AiAgentRunStatus, AiAgentRunSandboxProvider };
