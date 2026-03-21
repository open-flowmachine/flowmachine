import type { Id, Model } from "@/lib/schema";

const aiModels = [
  "anthropic/claude-opus-4.6",
  "anthropic/claude-sonnet-4.6",
] as const;
type AiModel = (typeof aiModels)[number];

type AiAgent = Model<{
  model: AiModel;
  name: string;
  projects: { id: Id }[];
}>;

type HttpClientCreateAiAgentInput = {
  body: {
    model: AiAgent["model"];
    name: AiAgent["name"];
    projects: AiAgent["projects"];
  };
};

type HttpClientDeleteAiAgentInput = {
  params: {
    id: Id;
  };
};

type HttpClientGetAiAgentInput = {
  params: {
    id: Id;
  };
};

type HttpClientAiAgentInput = {
  params: {
    id: Id;
  };
  body: {
    model?: AiAgent["model"];
    name?: AiAgent["name"];
    projects?: AiAgent["projects"];
  };
};

export { aiModels };
export type {
  AiAgent,
  HttpClientCreateAiAgentInput,
  HttpClientDeleteAiAgentInput,
  HttpClientGetAiAgentInput,
  HttpClientAiAgentInput,
};
