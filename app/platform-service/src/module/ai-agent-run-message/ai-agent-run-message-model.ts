import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";

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

export { aiAgentRunMessageRoles };
export type { AiAgentRunMessage, AiAgentRunMessageRole };
