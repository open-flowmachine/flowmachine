import type { DomainError } from "@/domain/shared/errors";
import type { Result } from "@/domain/shared/result";
import type { Tenant } from "@/domain/shared/tenant";

import type { GitRepository } from "@/domain/git-repository/git-repository";
import type { GitRepositoryId } from "@/domain/git-repository/git-repository-id";
import type { ProjectId } from "@/domain/project/project-id";

type GitRepositoryRepository = {
  findById(input: {
    id: GitRepositoryId;
    tenant: Tenant;
  }): Promise<Result<GitRepository | null, DomainError>>;
  findMany(input: {
    tenant: Tenant;
    filter?: { projectId?: ProjectId };
  }): Promise<Result<readonly GitRepository[], DomainError>>;
  save(aggregate: GitRepository): Promise<Result<void, DomainError>>;
  delete(aggregate: GitRepository): Promise<Result<void, DomainError>>;
};

export type { GitRepositoryRepository };
