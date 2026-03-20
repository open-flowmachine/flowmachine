import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";

const aiModels = [
  "anthropic/claude-haiku-4.5",
  "anthropic/claude-opus-4.5",
  "anthropic/claude-sonnet-4.5",
  "minimax/minimax-m2.1",
  "x-ai/grok-code-fast-1",
  "z-ai/glm-4.7",
] as const;
type AiModel = (typeof aiModels)[number];

const syncStatuses = ["idle", "pending", "success", "error"] as const;
type SyncStatus = (typeof syncStatuses)[number];

type AiAgent = Model<{
  name: string;
  model: AiModel;
  projects: {
    id: Id;
    syncStatus: SyncStatus;
    syncedAt: Date | null;
  }[];
}>;

export { aiModels, syncStatuses };
export type { AiAgent, AiModel, SyncStatus };
