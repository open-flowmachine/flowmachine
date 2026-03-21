import { format } from "date-fns";
import type { AiAgent } from "@/module/ai-agent/ai-agent-type";

const modelToDisplayName = {
  "anthropic/claude-opus-4.6": "Claude Opus 4.6",
  "anthropic/claude-sonnet-4.6": "Claude Sonnet 4.6",
} as const satisfies Record<AiAgent["model"], string>;

const makeAiAgentService = (input: { aiAgent: AiAgent }) => {
  const { aiAgent } = input;
  return {
    getModelDisplayName: () => modelToDisplayName[aiAgent.model],
    getCreatedAt: () => format(aiAgent.createdAt, "MMM d, yyyy, h:mm a"),
    getUpdatedAt: () => format(aiAgent.updatedAt, "MMM d, yyyy, h:mm a"),
  };
};

export { makeAiAgentService };
