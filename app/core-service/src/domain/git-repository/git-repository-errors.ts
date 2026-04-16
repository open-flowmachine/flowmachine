import { DomainError } from "@/domain/shared/errors";

class GitRepositoryNotFoundError extends DomainError {
  override readonly name = "GitRepositoryNotFoundError";
  readonly category = "not-found" as const;

  constructor(id: string) {
    super(`Git repository "${id}" not found`);
  }
}

class InvalidGitUrlError extends DomainError {
  override readonly name = "InvalidGitUrlError";
  readonly category = "invariant-violated" as const;

  constructor(url: string) {
    super(`Invalid git URL "${url}"`);
  }
}

class GitProviderImmutableError extends DomainError {
  override readonly name = "GitProviderImmutableError";
  readonly category = "invalid-transition" as const;

  constructor() {
    super(
      "Git repository provider cannot be changed after creation. Create a new repository instead.",
    );
  }
}

class ProjectAlreadyLinkedToGitRepositoryError extends DomainError {
  override readonly name = "ProjectAlreadyLinkedToGitRepositoryError";
  readonly category = "conflict" as const;

  constructor(projectId: string) {
    super(`Project "${projectId}" is already linked to this git repository`);
  }
}

class ProjectNotLinkedToGitRepositoryError extends DomainError {
  override readonly name = "ProjectNotLinkedToGitRepositoryError";
  readonly category = "not-found" as const;

  constructor(projectId: string) {
    super(`Project "${projectId}" is not linked to this git repository`);
  }
}

export {
  GitProviderImmutableError,
  GitRepositoryNotFoundError,
  InvalidGitUrlError,
  ProjectAlreadyLinkedToGitRepositoryError,
  ProjectNotLinkedToGitRepositoryError,
};
