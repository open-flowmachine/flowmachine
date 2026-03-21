import type { Model } from "@/lib/schema";

type WorkflowActionDefinition = Model<{
  kind: string;
  name: string;
}>;

export type { WorkflowActionDefinition };
