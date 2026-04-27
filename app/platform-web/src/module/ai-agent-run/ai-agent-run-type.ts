import type { Id, Model } from "@/lib/schema";

const aiAgentRunStatuses = [
  "provisioning",
  "idle",
  "processing",
  "stopped",
  "errored",
] as const;
type AiAgentRunStatus = (typeof aiAgentRunStatuses)[number];

const aiAgentRunTerminalStatuses = ["stopped", "errored"] as const satisfies
  readonly AiAgentRunStatus[];

const aiAgentRunEndedReasons = [
  "user_stop",
  "idle_timeout",
  "error",
] as const;
type AiAgentRunEndedReason = (typeof aiAgentRunEndedReasons)[number];

type AiAgentRun = Model<{
  aiAgentId: Id;
  status: AiAgentRunStatus;
  sessionId: string | null;
  startedAt: string;
  lastMessageAt: string | null;
  endedAt: string | null;
  endedReason: AiAgentRunEndedReason | null;
}>;

type HttpClientListAiAgentRunsInput = {
  params: {
    aiAgentId: Id;
  };
};

type HttpClientGetAiAgentRunInput = {
  params: {
    aiAgentId: Id;
    runId: Id;
  };
};

type HttpClientCreateAiAgentRunInput = {
  params: {
    aiAgentId: Id;
  };
};

type HttpClientStopAiAgentRunInput = {
  params: {
    aiAgentId: Id;
    runId: Id;
  };
};

const isAiAgentRunTerminal = (status: AiAgentRunStatus) =>
  (aiAgentRunTerminalStatuses as readonly AiAgentRunStatus[]).includes(status);

export {
  aiAgentRunStatuses,
  aiAgentRunTerminalStatuses,
  aiAgentRunEndedReasons,
  isAiAgentRunTerminal,
};
export type {
  AiAgentRun,
  AiAgentRunStatus,
  AiAgentRunEndedReason,
  HttpClientCreateAiAgentRunInput,
  HttpClientGetAiAgentRunInput,
  HttpClientListAiAgentRunsInput,
  HttpClientStopAiAgentRunInput,
};
