import type { DomainError } from "@/domain/shared/errors";
import type { Result } from "@/domain/shared/result";
import type { Tenant } from "@/domain/shared/tenant";

import type { Project } from "@/domain/project/project";
import type { ProjectId } from "@/domain/project/project-id";

type ProjectRepository = {
  findById(input: {
    id: ProjectId;
    tenant: Tenant;
  }): Promise<Result<Project | null, DomainError>>;
  findMany(input: {
    tenant: Tenant;
  }): Promise<Result<readonly Project[], DomainError>>;
  save(aggregate: Project): Promise<Result<void, DomainError>>;
  delete(aggregate: Project): Promise<Result<void, DomainError>>;
};

export type { ProjectRepository };
