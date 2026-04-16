import { AggregateRoot } from "@/domain/shared/aggregate-root";
import { createMetadata, type Metadata } from "@/domain/shared/metadata";
import type { Tenant } from "@/domain/shared/tenant";

import type { ProjectEvent } from "@/domain/project/project-events";
import { InvalidProjectIntegrationError } from "@/domain/project/project-errors";
import type { ProjectId } from "@/domain/project/project-id";
import {
  isValidProjectIntegration,
  type ProjectIntegration,
} from "@/domain/project/project-value-objects";

type ProjectState = {
  name: string;
  integration: ProjectIntegration | null;
};

class Project extends AggregateRoot<ProjectId, ProjectEvent> {
  #state: ProjectState;

  protected constructor(input: {
    id: ProjectId;
    tenant: Tenant;
    metadata: Metadata;
    state: ProjectState;
  }) {
    super({ id: input.id, tenant: input.tenant, metadata: input.metadata });
    this.#state = input.state;
  }

  static create(input: {
    id: ProjectId;
    tenant: Tenant;
    name: string;
    integration: ProjectIntegration | null;
    now: Date;
  }): Project {
    if (input.integration && !isValidProjectIntegration(input.integration)) {
      throw new InvalidProjectIntegrationError(
        "one or more integration fields are empty",
      );
    }
    const project = new Project({
      id: input.id,
      tenant: input.tenant,
      metadata: createMetadata(input.now),
      state: { name: input.name, integration: input.integration },
    });
    project.raise({
      name: "ProjectCreated",
      aggregateId: input.id,
      occurredAt: input.now,
      payload: { projectId: input.id, name: input.name },
    });
    if (input.integration) {
      project.raise({
        name: "ProjectIntegrationConfigured",
        aggregateId: input.id,
        occurredAt: input.now,
        payload: {
          projectId: input.id,
          provider: input.integration.provider,
          integration: input.integration,
        },
      });
    }
    return project;
  }

  static fromPersistence(input: {
    id: ProjectId;
    tenant: Tenant;
    metadata: Metadata;
    state: ProjectState;
  }): Project {
    return new Project(input);
  }

  get name(): string {
    return this.#state.name;
  }

  get integration(): ProjectIntegration | null {
    return this.#state.integration;
  }

  rename(name: string, now: Date): void {
    if (name === this.#state.name) return;
    this.#state = { ...this.#state, name };
    this.touch(now);
    this.raise({
      name: "ProjectRenamed",
      aggregateId: this.id,
      occurredAt: now,
      payload: { projectId: this.id, name },
    });
  }

  configureIntegration(input: {
    integration: ProjectIntegration;
    now: Date;
  }): void {
    if (!isValidProjectIntegration(input.integration)) {
      throw new InvalidProjectIntegrationError(
        "one or more integration fields are empty",
      );
    }
    this.#state = { ...this.#state, integration: input.integration };
    this.touch(input.now);
    this.raise({
      name: "ProjectIntegrationConfigured",
      aggregateId: this.id,
      occurredAt: input.now,
      payload: {
        projectId: this.id,
        provider: input.integration.provider,
        integration: input.integration,
      },
    });
  }

  removeIntegration(now: Date): void {
    if (!this.#state.integration) return;
    const previousProvider = this.#state.integration.provider;
    this.#state = { ...this.#state, integration: null };
    this.touch(now);
    this.raise({
      name: "ProjectIntegrationRemoved",
      aggregateId: this.id,
      occurredAt: now,
      payload: { projectId: this.id, provider: previousProvider },
    });
  }
}

export { Project };
