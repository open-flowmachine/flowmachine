import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";

type WorkflowAction = {
  id: string;
  kind: string;
  name: string;
  inputs?: Record<string, unknown>;
};

type WorkflowEdge = {
  from: string;
  to: string;
};

type WorkflowDefinition = Model<{
  name: string;
  description?: string;
  projects: {
    id: Id;
  }[];
  actions: WorkflowAction[];
  edges: WorkflowEdge[];
  isActive: boolean;
}>;

export type { WorkflowDefinition, WorkflowAction, WorkflowEdge };
