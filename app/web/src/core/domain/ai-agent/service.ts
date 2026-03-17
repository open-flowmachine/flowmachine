import { format } from "date-fns";
import type { AiAgentDomain } from "@/core/domain/ai-agent/entity";

type MakeAiAgentDomainServiceInput = {
  aiAgent: AiAgentDomain;
};

export const makeAiAgentDomainService = ({
  aiAgent,
}: MakeAiAgentDomainServiceInput) => ({
  getModelDisplayName: () => modelToDisplayName[aiAgent.model],
  getCreatedAt: () => format(aiAgent.createdAt, "MMM d, yyyy, h:mm a"),
  getUpdatedAt: () => format(aiAgent.updatedAt, "MMM d, yyyy, h:mm a"),
});

const modelToDisplayName = {
  "anthropic/claude-haiku-4.5": "Claude Haiku 4.5",
  "anthropic/claude-opus-4.5": "Claude Opus 4.5",
  "anthropic/claude-sonnet-4.5": "Claude Sonnet 4.5",
  "minimax/minimax-m2.1": "MiniMax M2.1",
  "x-ai/grok-code-fast-1": "Grok Code Fast 1",
  "z-ai/glm-4.7": "GLM 4.7",
} as const satisfies Record<AiAgentDomain["model"], string>;
