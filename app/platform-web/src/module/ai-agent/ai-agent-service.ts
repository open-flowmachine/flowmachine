import { format } from "date-fns";

import type { AiAgent } from "@/module/ai-agent/ai-agent-type";

const modelToDisplayName = {
  "claude-opus-4-7": "Claude Opus 4.7",
  "claude-sonnet-4-6": "Claude Sonnet 4.6",
  "claude-haiku-4-5": "Claude Haiku 4.5",
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
