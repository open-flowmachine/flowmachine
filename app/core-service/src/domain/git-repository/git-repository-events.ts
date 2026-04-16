import type { DomainEvent } from "@/domain/shared/domain-event";

import type { CredentialId } from "@/domain/credential/credential-id";
import type { GitRepositoryId } from "@/domain/git-repository/git-repository-id";
import type {
  GitProvider,
  GitRepositoryConfig,
} from "@/domain/git-repository/git-repository-value-objects";
import type { ProjectId } from "@/domain/project/project-id";

type GitRepositoryCreated = DomainEvent<
  "GitRepositoryCreated",
  {
    readonly gitRepositoryId: GitRepositoryId;
    readonly name: string;
    readonly url: string;
    readonly provider: GitProvider;
  }
>;

type GitRepositoryConfigUpdated = DomainEvent<
  "GitRepositoryConfigUpdated",
  {
    readonly gitRepositoryId: GitRepositoryId;
    readonly config: GitRepositoryConfig;
  }
>;

type GitRepositoryCredentialRotated = DomainEvent<
  "GitRepositoryCredentialRotated",
  {
    readonly gitRepositoryId: GitRepositoryId;
    readonly credentialId: CredentialId;
  }
>;

type GitRepositoryLinkedToProject = DomainEvent<
  "GitRepositoryLinkedToProject",
  {
    readonly gitRepositoryId: GitRepositoryId;
    readonly projectId: ProjectId;
  }
>;

type GitRepositoryUnlinkedFromProject = DomainEvent<
  "GitRepositoryUnlinkedFromProject",
  {
    readonly gitRepositoryId: GitRepositoryId;
    readonly projectId: ProjectId;
  }
>;

type GitRepositoryEvent =
  | GitRepositoryCreated
  | GitRepositoryConfigUpdated
  | GitRepositoryCredentialRotated
  | GitRepositoryLinkedToProject
  | GitRepositoryUnlinkedFromProject;

export type {
  GitRepositoryConfigUpdated,
  GitRepositoryCreated,
  GitRepositoryCredentialRotated,
  GitRepositoryEvent,
  GitRepositoryLinkedToProject,
  GitRepositoryUnlinkedFromProject,
};
