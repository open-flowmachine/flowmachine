import { AggregateRoot } from "@/domain/shared/aggregate-root";
import { createMetadata, type Metadata } from "@/domain/shared/metadata";
import type { Tenant } from "@/domain/shared/tenant";

import type { ProjectId } from "@/domain/project/project-id";
import type { IssueFieldDefinitionEvent } from "@/domain/project-issue-field/project-issue-field-events";
import {
  DuplicateOptionValueError,
  EmptyOptionsError,
} from "@/domain/project-issue-field/project-issue-field-errors";
import type { ProjectIssueFieldDefinitionId } from "@/domain/project-issue-field/project-issue-field-id";
import type {
  IssueFieldIntegration,
  IssueFieldOption,
  IssueFieldType,
} from "@/domain/project-issue-field/project-issue-field-value-objects";

type ProjectIssueFieldDefinitionState = {
  name: string;
  type: IssueFieldType;
  options: readonly IssueFieldOption[];
  integration: IssueFieldIntegration | null;
  projectId: ProjectId;
};

const assertValidOptions = (options: readonly IssueFieldOption[]): void => {
  if (options.length === 0) {
    throw new EmptyOptionsError();
  }
  const seen = new Set<string>();
  for (const option of options) {
    if (seen.has(option.value)) {
      throw new DuplicateOptionValueError(option.value);
    }
    seen.add(option.value);
  }
};

class ProjectIssueFieldDefinition extends AggregateRoot<
  ProjectIssueFieldDefinitionId,
  IssueFieldDefinitionEvent
> {
  #state: ProjectIssueFieldDefinitionState;

  protected constructor(input: {
    id: ProjectIssueFieldDefinitionId;
    tenant: Tenant;
    metadata: Metadata;
    state: ProjectIssueFieldDefinitionState;
  }) {
    super({ id: input.id, tenant: input.tenant, metadata: input.metadata });
    this.#state = input.state;
  }

  static create(input: {
    id: ProjectIssueFieldDefinitionId;
    tenant: Tenant;
    projectId: ProjectId;
    name: string;
    type: IssueFieldType;
    options: readonly IssueFieldOption[];
    integration: IssueFieldIntegration | null;
    now: Date;
  }): ProjectIssueFieldDefinition {
    assertValidOptions(input.options);
    const definition = new ProjectIssueFieldDefinition({
      id: input.id,
      tenant: input.tenant,
      metadata: createMetadata(input.now),
      state: {
        name: input.name,
        type: input.type,
        options: input.options,
        integration: input.integration,
        projectId: input.projectId,
      },
    });
    definition.raise({
      name: "IssueFieldDefinitionCreated",
      aggregateId: input.id,
      occurredAt: input.now,
      payload: {
        issueFieldDefinitionId: input.id,
        projectId: input.projectId,
        name: input.name,
        type: input.type,
        options: input.options,
      },
    });
    return definition;
  }

  static fromPersistence(input: {
    id: ProjectIssueFieldDefinitionId;
    tenant: Tenant;
    metadata: Metadata;
    state: ProjectIssueFieldDefinitionState;
  }): ProjectIssueFieldDefinition {
    return new ProjectIssueFieldDefinition(input);
  }

  get name(): string {
    return this.#state.name;
  }

  get type(): IssueFieldType {
    return this.#state.type;
  }

  get options(): readonly IssueFieldOption[] {
    return this.#state.options;
  }

  get integration(): IssueFieldIntegration | null {
    return this.#state.integration;
  }

  get projectId(): ProjectId {
    return this.#state.projectId;
  }

  updateOptions(options: readonly IssueFieldOption[], now: Date): void {
    assertValidOptions(options);
    this.#state = { ...this.#state, options };
    this.touch(now);
    this.raise({
      name: "IssueFieldOptionsUpdated",
      aggregateId: this.id,
      occurredAt: now,
      payload: { issueFieldDefinitionId: this.id, options },
    });
  }

  linkToProvider(integration: IssueFieldIntegration, now: Date): void {
    this.#state = { ...this.#state, integration };
    this.touch(now);
    this.raise({
      name: "IssueFieldSyncedToProvider",
      aggregateId: this.id,
      occurredAt: now,
      payload: {
        issueFieldDefinitionId: this.id,
        provider: integration.provider,
        integration,
      },
    });
  }

  unlinkFromProvider(now: Date): void {
    if (!this.#state.integration) return;
    const previousProvider = this.#state.integration.provider;
    this.#state = { ...this.#state, integration: null };
    this.touch(now);
    this.raise({
      name: "IssueFieldUnlinkedFromProvider",
      aggregateId: this.id,
      occurredAt: now,
      payload: {
        issueFieldDefinitionId: this.id,
        provider: previousProvider,
      },
    });
  }
}

export { ProjectIssueFieldDefinition };
