import type { Brand } from "@/domain/shared/id";

type AiAgentId = Brand<string, "AiAgentId">;
const AiAgentId = (value: string): AiAgentId => value as AiAgentId;

export { AiAgentId };
