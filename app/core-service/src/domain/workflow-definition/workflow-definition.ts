import { AggregateRoot } from "@/domain/shared/aggregate-root";
import { createMetadata, type Metadata } from "@/domain/shared/metadata";
import type { Tenant } from "@/domain/shared/tenant";

import type { ProjectId } from "@/domain/project/project-id";
import {
  ActionNotFoundError,
  CycleDetectedError,
  DanglingEdgeError,
  DuplicateActionIdError,
} from "@/domain/workflow-definition/workflow-definition-errors";
import type { WorkflowDefinitionEvent } from "@/domain/workflow-definition/workflow-definition-events";
import type { WorkflowDefinitionId } from "@/domain/workflow-definition/workflow-definition-id";
import type {
  WorkflowAction,
  WorkflowEdge,
} from "@/domain/workflow-definition/workflow-definition-value-objects";

type WorkflowDefinitionState = {
  name: string;
  description: string | undefined;
  projectIds: readonly ProjectId[];
  actions: readonly WorkflowAction[];
  edges: readonly WorkflowEdge[];
  isActive: boolean;
};

const assertUniqueActionIds = (actions: readonly WorkflowAction[]): void => {
  const seen = new Set<string>();
  for (const action of actions) {
    if (seen.has(action.id)) {
      throw new DuplicateActionIdError(action.id);
    }
    seen.add(action.id);
  }
};

const assertEdgesReferenceKnownActions = (
  actions: readonly WorkflowAction[],
  edges: readonly WorkflowEdge[],
): void => {
  const ids = new Set(actions.map((a) => a.id));
  for (const edge of edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) {
      throw new DanglingEdgeError(edge.from, edge.to);
    }
  }
};

const assertAcyclic = (
  actions: readonly WorkflowAction[],
  edges: readonly WorkflowEdge[],
): void => {
  const adjacency = new Map<string, string[]>();
  for (const action of actions) adjacency.set(action.id, []);
  for (const edge of edges) adjacency.get(edge.from)?.push(edge.to);

  const visited = new Set<string>();
  const stack = new Set<string>();

  const visit = (node: string): void => {
    if (stack.has(node)) throw new CycleDetectedError();
    if (visited.has(node)) return;
    stack.add(node);
    for (const next of adjacency.get(node) ?? []) visit(next);
    stack.delete(node);
    visited.add(node);
  };

  for (const action of actions) visit(action.id);
};

const assertGraphValid = (
  actions: readonly WorkflowAction[],
  edges: readonly WorkflowEdge[],
): void => {
  assertUniqueActionIds(actions);
  assertEdgesReferenceKnownActions(actions, edges);
  assertAcyclic(actions, edges);
};

class WorkflowDefinition extends AggregateRoot<
  WorkflowDefinitionId,
  WorkflowDefinitionEvent
> {
  #state: WorkflowDefinitionState;

  protected constructor(input: {
    id: WorkflowDefinitionId;
    tenant: Tenant;
    metadata: Metadata;
    state: WorkflowDefinitionState;
  }) {
    super({ id: input.id, tenant: input.tenant, metadata: input.metadata });
    this.#state = input.state;
  }

  static create(input: {
    id: WorkflowDefinitionId;
    tenant: Tenant;
    name: string;
    description?: string;
    projectIds?: readonly ProjectId[];
    actions?: readonly WorkflowAction[];
    edges?: readonly WorkflowEdge[];
    isActive?: boolean;
    now: Date;
  }): WorkflowDefinition {
    const actions = input.actions ?? [];
    const edges = input.edges ?? [];
    assertGraphValid(actions, edges);
    const definition = new WorkflowDefinition({
      id: input.id,
      tenant: input.tenant,
      metadata: createMetadata(input.now),
      state: {
        name: input.name,
        description: input.description,
        projectIds: input.projectIds ?? [],
        actions,
        edges,
        isActive: input.isActive ?? false,
      },
    });
    definition.raise({
      name: "WorkflowDefinitionCreated",
      aggregateId: input.id,
      occurredAt: input.now,
      payload: { workflowDefinitionId: input.id, name: input.name },
    });
    return definition;
  }

  static fromPersistence(input: {
    id: WorkflowDefinitionId;
    tenant: Tenant;
    metadata: Metadata;
    state: WorkflowDefinitionState;
  }): WorkflowDefinition {
    return new WorkflowDefinition(input);
  }

  get name(): string {
    return this.#state.name;
  }
  get description(): string | undefined {
    return this.#state.description;
  }
  get projectIds(): readonly ProjectId[] {
    return this.#state.projectIds;
  }
  get actions(): readonly WorkflowAction[] {
    return this.#state.actions;
  }
  get edges(): readonly WorkflowEdge[] {
    return this.#state.edges;
  }
  get isActive(): boolean {
    return this.#state.isActive;
  }

  addAction(action: WorkflowAction, now: Date): void {
    const actions = [...this.#state.actions, action];
    assertGraphValid(actions, this.#state.edges);
    this.#state = { ...this.#state, actions };
    this.touch(now);
    this.raise({
      name: "WorkflowActionAdded",
      aggregateId: this.id,
      occurredAt: now,
      payload: { workflowDefinitionId: this.id, action },
    });
  }

  removeAction(actionId: string, now: Date): void {
    const exists = this.#state.actions.some((a) => a.id === actionId);
    if (!exists) throw new ActionNotFoundError(actionId);
    const actions = this.#state.actions.filter((a) => a.id !== actionId);
    const edges = this.#state.edges.filter(
      (e) => e.from !== actionId && e.to !== actionId,
    );
    this.#state = { ...this.#state, actions, edges };
    this.touch(now);
    this.raise({
      name: "WorkflowActionRemoved",
      aggregateId: this.id,
      occurredAt: now,
      payload: { workflowDefinitionId: this.id, actionId },
    });
  }

  addEdge(edge: WorkflowEdge, now: Date): void {
    const edges = [...this.#state.edges, edge];
    assertGraphValid(this.#state.actions, edges);
    this.#state = { ...this.#state, edges };
    this.touch(now);
    this.raise({
      name: "WorkflowEdgeAdded",
      aggregateId: this.id,
      occurredAt: now,
      payload: { workflowDefinitionId: this.id, edge },
    });
  }

  removeEdge(edge: WorkflowEdge, now: Date): void {
    const edges = this.#state.edges.filter(
      (e) => !(e.from === edge.from && e.to === edge.to),
    );
    this.#state = { ...this.#state, edges };
    this.touch(now);
    this.raise({
      name: "WorkflowEdgeRemoved",
      aggregateId: this.id,
      occurredAt: now,
      payload: { workflowDefinitionId: this.id, edge },
    });
  }

  activate(now: Date): void {
    if (this.#state.isActive) return;
    this.#state = { ...this.#state, isActive: true };
    this.touch(now);
    this.raise({
      name: "WorkflowDefinitionActivated",
      aggregateId: this.id,
      occurredAt: now,
      payload: { workflowDefinitionId: this.id },
    });
  }

  deactivate(now: Date): void {
    if (!this.#state.isActive) return;
    this.#state = { ...this.#state, isActive: false };
    this.touch(now);
    this.raise({
      name: "WorkflowDefinitionDeactivated",
      aggregateId: this.id,
      occurredAt: now,
      payload: { workflowDefinitionId: this.id },
    });
  }

  linkToProject(projectId: ProjectId, now: Date): void {
    if (this.#state.projectIds.includes(projectId)) return;
    this.#state = {
      ...this.#state,
      projectIds: [...this.#state.projectIds, projectId],
    };
    this.touch(now);
    this.raise({
      name: "WorkflowDefinitionLinkedToProject",
      aggregateId: this.id,
      occurredAt: now,
      payload: { workflowDefinitionId: this.id, projectId },
    });
  }

  unlinkFromProject(projectId: ProjectId, now: Date): void {
    if (!this.#state.projectIds.includes(projectId)) return;
    this.#state = {
      ...this.#state,
      projectIds: this.#state.projectIds.filter((id) => id !== projectId),
    };
    this.touch(now);
    this.raise({
      name: "WorkflowDefinitionUnlinkedFromProject",
      aggregateId: this.id,
      occurredAt: now,
      payload: { workflowDefinitionId: this.id, projectId },
    });
  }

  toSnapshot(): Readonly<Record<string, unknown>> {
    return {
      id: this.id,
      name: this.#state.name,
      description: this.#state.description,
      actions: this.#state.actions,
      edges: this.#state.edges,
      isActive: this.#state.isActive,
      version: this.version,
    };
  }
}

export { WorkflowDefinition };
