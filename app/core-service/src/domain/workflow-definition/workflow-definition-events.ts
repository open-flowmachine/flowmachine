import type { DomainEvent } from "@/domain/shared/domain-event";

import type { ProjectId } from "@/domain/project/project-id";
import type { WorkflowDefinitionId } from "@/domain/workflow-definition/workflow-definition-id";
import type {
  WorkflowAction,
  WorkflowEdge,
} from "@/domain/workflow-definition/workflow-definition-value-objects";

type WorkflowDefinitionCreated = DomainEvent<
  "WorkflowDefinitionCreated",
  {
    readonly workflowDefinitionId: WorkflowDefinitionId;
    readonly name: string;
  }
>;

type WorkflowDefinitionActivated = DomainEvent<
  "WorkflowDefinitionActivated",
  { readonly workflowDefinitionId: WorkflowDefinitionId }
>;

type WorkflowDefinitionDeactivated = DomainEvent<
  "WorkflowDefinitionDeactivated",
  { readonly workflowDefinitionId: WorkflowDefinitionId }
>;

type WorkflowActionAdded = DomainEvent<
  "WorkflowActionAdded",
  {
    readonly workflowDefinitionId: WorkflowDefinitionId;
    readonly action: WorkflowAction;
  }
>;

type WorkflowActionRemoved = DomainEvent<
  "WorkflowActionRemoved",
  {
    readonly workflowDefinitionId: WorkflowDefinitionId;
    readonly actionId: string;
  }
>;

type WorkflowEdgeAdded = DomainEvent<
  "WorkflowEdgeAdded",
  {
    readonly workflowDefinitionId: WorkflowDefinitionId;
    readonly edge: WorkflowEdge;
  }
>;

type WorkflowEdgeRemoved = DomainEvent<
  "WorkflowEdgeRemoved",
  {
    readonly workflowDefinitionId: WorkflowDefinitionId;
    readonly edge: WorkflowEdge;
  }
>;

type WorkflowDefinitionLinkedToProject = DomainEvent<
  "WorkflowDefinitionLinkedToProject",
  {
    readonly workflowDefinitionId: WorkflowDefinitionId;
    readonly projectId: ProjectId;
  }
>;

type WorkflowDefinitionUnlinkedFromProject = DomainEvent<
  "WorkflowDefinitionUnlinkedFromProject",
  {
    readonly workflowDefinitionId: WorkflowDefinitionId;
    readonly projectId: ProjectId;
  }
>;

type WorkflowDefinitionEvent =
  | WorkflowDefinitionCreated
  | WorkflowDefinitionActivated
  | WorkflowDefinitionDeactivated
  | WorkflowActionAdded
  | WorkflowActionRemoved
  | WorkflowEdgeAdded
  | WorkflowEdgeRemoved
  | WorkflowDefinitionLinkedToProject
  | WorkflowDefinitionUnlinkedFromProject;

export type {
  WorkflowActionAdded,
  WorkflowActionRemoved,
  WorkflowDefinitionActivated,
  WorkflowDefinitionCreated,
  WorkflowDefinitionDeactivated,
  WorkflowDefinitionEvent,
  WorkflowDefinitionLinkedToProject,
  WorkflowDefinitionUnlinkedFromProject,
  WorkflowEdgeAdded,
  WorkflowEdgeRemoved,
};
