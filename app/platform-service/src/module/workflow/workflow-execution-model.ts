import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";

const workflowProvider = ["inngest"] as const;
type WorkflowProvider = (typeof workflowProvider)[number];

type WorkflowExecution = Model<{
  integration: {
    externalId: string;
    provider: WorkflowProvider;
  };
  workflowDefinition: {
    id: Id;
    raw: Record<string, unknown>;
  };
}>;

export type { WorkflowExecution };
