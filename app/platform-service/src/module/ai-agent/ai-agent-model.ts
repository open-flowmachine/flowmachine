import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";

const aiModels = [
  "anthropic/claude-opus-4.6",
  "anthropic/claude-sonnet-4.6",
] as const;
type AiModel = (typeof aiModels)[number];

type AiAgent = Model<{
  name: string;
  model: AiModel;
  projects: {
    id: Id;
  }[];
}>;

export { aiModels };
export type { AiAgent, AiModel };
