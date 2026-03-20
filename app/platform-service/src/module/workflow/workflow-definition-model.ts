import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";

const workflowDefinitionProjectSyncStatuses = [
  "idle",
  "pending",
  "success",
  "error",
] as const;
type WorkflowDefinitionProjectSyncStatus =
  (typeof workflowDefinitionProjectSyncStatuses)[number];

type WorkflowDefinitionProject = {
  id: Id;
  syncStatus: WorkflowDefinitionProjectSyncStatus;
  syncedAt: Date | null;
};

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
  projects: WorkflowDefinitionProject[];
  actions: WorkflowAction[];
  edges: WorkflowEdge[];
  isActive: boolean;
}>;

export { workflowDefinitionProjectSyncStatuses };
export type {
  WorkflowDefinition,
  WorkflowDefinitionProject,
  WorkflowDefinitionProjectSyncStatus,
  WorkflowAction,
  WorkflowEdge,
};
