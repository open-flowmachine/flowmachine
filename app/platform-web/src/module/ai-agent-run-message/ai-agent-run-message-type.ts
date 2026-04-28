import type { Id, Model } from "@/lib/schema";

const aiAgentRunMessageRoles = [
  "user",
  "assistant",
  "tool_use",
  "tool_result",
  "system",
] as const;
type AiAgentRunMessageRole = (typeof aiAgentRunMessageRoles)[number];

type AiAgentRunMessage = Model<{
  aiAgentRunId: Id;
  role: AiAgentRunMessageRole;
  content: string;
  toolName: string | null;
  toolInput: Record<string, unknown> | null;
  toolResult: Record<string, unknown> | null;
}>;

type HttpClientListAiAgentRunMessagesInput = {
  params: {
    aiAgentId: Id;
    runId: Id;
  };
};

type HttpClientSendAiAgentRunMessageInput = {
  params: {
    aiAgentId: Id;
    runId: Id;
  };
  body: {
    content: string;
  };
};

export { aiAgentRunMessageRoles };
export type {
  AiAgentRunMessage,
  AiAgentRunMessageRole,
  HttpClientListAiAgentRunMessagesInput,
  HttpClientSendAiAgentRunMessageInput,
};
