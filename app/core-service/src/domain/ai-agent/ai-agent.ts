import { AggregateRoot } from "@/domain/shared/aggregate-root";
import { createMetadata, type Metadata } from "@/domain/shared/metadata";
import type { Tenant } from "@/domain/shared/tenant";

import type { AiAgentEvent } from "@/domain/ai-agent/ai-agent-events";
import type { AiAgentId } from "@/domain/ai-agent/ai-agent-id";
import {
  ProjectAlreadyLinkedError,
  ProjectNotLinkedError,
} from "@/domain/ai-agent/ai-agent-errors";
import type { AiModel } from "@/domain/ai-agent/ai-agent-value-objects";
import type { ProjectId } from "@/domain/project/project-id";

type AiAgentState = {
  name: string;
  model: AiModel;
  projectIds: readonly ProjectId[];
};

class AiAgent extends AggregateRoot<AiAgentId, AiAgentEvent> {
  #state: AiAgentState;

  protected constructor(input: {
    id: AiAgentId;
    tenant: Tenant;
    metadata: Metadata;
    state: AiAgentState;
  }) {
    super({ id: input.id, tenant: input.tenant, metadata: input.metadata });
    this.#state = input.state;
  }

  static create(input: {
    id: AiAgentId;
    tenant: Tenant;
    name: string;
    model: AiModel;
    projectIds?: readonly ProjectId[];
    now: Date;
  }): AiAgent {
    const projectIds = input.projectIds ?? [];
    const agent = new AiAgent({
      id: input.id,
      tenant: input.tenant,
      metadata: createMetadata(input.now),
      state: { name: input.name, model: input.model, projectIds },
    });
    agent.raise({
      name: "AiAgentCreated",
      aggregateId: input.id,
      occurredAt: input.now,
      payload: {
        aiAgentId: input.id,
        name: input.name,
        model: input.model,
      },
    });
    return agent;
  }

  static fromPersistence(input: {
    id: AiAgentId;
    tenant: Tenant;
    metadata: Metadata;
    state: AiAgentState;
  }): AiAgent {
    return new AiAgent(input);
  }

  get name(): string {
    return this.#state.name;
  }

  get model(): AiModel {
    return this.#state.model;
  }

  get projectIds(): readonly ProjectId[] {
    return this.#state.projectIds;
  }

  rename(name: string, now: Date): void {
    if (name === this.#state.name) return;
    this.#state = { ...this.#state, name };
    this.touch(now);
    this.raise({
      name: "AiAgentRenamed",
      aggregateId: this.id,
      occurredAt: now,
      payload: { aiAgentId: this.id, name },
    });
  }

  changeModel(model: AiModel, now: Date): void {
    if (model === this.#state.model) return;
    this.#state = { ...this.#state, model };
    this.touch(now);
    this.raise({
      name: "AiAgentModelChanged",
      aggregateId: this.id,
      occurredAt: now,
      payload: { aiAgentId: this.id, model },
    });
  }

  linkToProject(projectId: ProjectId, now: Date): void {
    if (this.#state.projectIds.includes(projectId)) {
      throw new ProjectAlreadyLinkedError(projectId);
    }
    this.#state = {
      ...this.#state,
      projectIds: [...this.#state.projectIds, projectId],
    };
    this.touch(now);
    this.raise({
      name: "AiAgentLinkedToProject",
      aggregateId: this.id,
      occurredAt: now,
      payload: { aiAgentId: this.id, projectId },
    });
  }

  unlinkFromProject(projectId: ProjectId, now: Date): void {
    if (!this.#state.projectIds.includes(projectId)) {
      throw new ProjectNotLinkedError(projectId);
    }
    this.#state = {
      ...this.#state,
      projectIds: this.#state.projectIds.filter((id) => id !== projectId),
    };
    this.touch(now);
    this.raise({
      name: "AiAgentUnlinkedFromProject",
      aggregateId: this.id,
      occurredAt: now,
      payload: { aiAgentId: this.id, projectId },
    });
  }
}

export { AiAgent };
