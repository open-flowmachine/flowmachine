import { AggregateRoot } from "@/domain/shared/aggregate-root";
import { createMetadata, type Metadata } from "@/domain/shared/metadata";
import type { Tenant } from "@/domain/shared/tenant";

import type { CredentialId } from "@/domain/credential/credential-id";
import type { GitRepositoryEvent } from "@/domain/git-repository/git-repository-events";
import type { GitRepositoryId } from "@/domain/git-repository/git-repository-id";
import {
  InvalidGitUrlError,
  ProjectAlreadyLinkedToGitRepositoryError,
  ProjectNotLinkedToGitRepositoryError,
} from "@/domain/git-repository/git-repository-errors";
import type {
  GitRepositoryConfig,
  GitRepositoryIntegration,
} from "@/domain/git-repository/git-repository-value-objects";
import type { ProjectId } from "@/domain/project/project-id";

type GitRepositoryState = {
  name: string;
  url: string;
  config: GitRepositoryConfig;
  integration: GitRepositoryIntegration;
  projectIds: readonly ProjectId[];
};

const assertValidUrl = (url: string): void => {
  if (url.length === 0 || !url.includes("://")) {
    throw new InvalidGitUrlError(url);
  }
};

class GitRepository extends AggregateRoot<GitRepositoryId, GitRepositoryEvent> {
  #state: GitRepositoryState;

  protected constructor(input: {
    id: GitRepositoryId;
    tenant: Tenant;
    metadata: Metadata;
    state: GitRepositoryState;
  }) {
    super({ id: input.id, tenant: input.tenant, metadata: input.metadata });
    this.#state = input.state;
  }

  static create(input: {
    id: GitRepositoryId;
    tenant: Tenant;
    name: string;
    url: string;
    config: GitRepositoryConfig;
    integration: GitRepositoryIntegration;
    projectIds?: readonly ProjectId[];
    now: Date;
  }): GitRepository {
    assertValidUrl(input.url);
    const projectIds = input.projectIds ?? [];
    const repo = new GitRepository({
      id: input.id,
      tenant: input.tenant,
      metadata: createMetadata(input.now),
      state: {
        name: input.name,
        url: input.url,
        config: input.config,
        integration: input.integration,
        projectIds,
      },
    });
    repo.raise({
      name: "GitRepositoryCreated",
      aggregateId: input.id,
      occurredAt: input.now,
      payload: {
        gitRepositoryId: input.id,
        name: input.name,
        url: input.url,
        provider: input.integration.provider,
      },
    });
    return repo;
  }

  static fromPersistence(input: {
    id: GitRepositoryId;
    tenant: Tenant;
    metadata: Metadata;
    state: GitRepositoryState;
  }): GitRepository {
    return new GitRepository(input);
  }

  get name(): string {
    return this.#state.name;
  }
  get url(): string {
    return this.#state.url;
  }
  get config(): GitRepositoryConfig {
    return this.#state.config;
  }
  get integration(): GitRepositoryIntegration {
    return this.#state.integration;
  }
  get projectIds(): readonly ProjectId[] {
    return this.#state.projectIds;
  }

  updateConfig(config: GitRepositoryConfig, now: Date): void {
    this.#state = { ...this.#state, config };
    this.touch(now);
    this.raise({
      name: "GitRepositoryConfigUpdated",
      aggregateId: this.id,
      occurredAt: now,
      payload: { gitRepositoryId: this.id, config },
    });
  }

  rotateCredential(credentialId: CredentialId, now: Date): void {
    if (credentialId === this.#state.integration.credentialId) return;
    this.#state = {
      ...this.#state,
      integration: { ...this.#state.integration, credentialId },
    };
    this.touch(now);
    this.raise({
      name: "GitRepositoryCredentialRotated",
      aggregateId: this.id,
      occurredAt: now,
      payload: { gitRepositoryId: this.id, credentialId },
    });
  }

  linkToProject(projectId: ProjectId, now: Date): void {
    if (this.#state.projectIds.includes(projectId)) {
      throw new ProjectAlreadyLinkedToGitRepositoryError(projectId);
    }
    this.#state = {
      ...this.#state,
      projectIds: [...this.#state.projectIds, projectId],
    };
    this.touch(now);
    this.raise({
      name: "GitRepositoryLinkedToProject",
      aggregateId: this.id,
      occurredAt: now,
      payload: { gitRepositoryId: this.id, projectId },
    });
  }

  unlinkFromProject(projectId: ProjectId, now: Date): void {
    if (!this.#state.projectIds.includes(projectId)) {
      throw new ProjectNotLinkedToGitRepositoryError(projectId);
    }
    this.#state = {
      ...this.#state,
      projectIds: this.#state.projectIds.filter((id) => id !== projectId),
    };
    this.touch(now);
    this.raise({
      name: "GitRepositoryUnlinkedFromProject",
      aggregateId: this.id,
      occurredAt: now,
      payload: { gitRepositoryId: this.id, projectId },
    });
  }
}

export { GitRepository };
