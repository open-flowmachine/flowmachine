import type { DomainError } from "@/domain/shared/errors";
import type { Result } from "@/domain/shared/result";
import type { Tenant } from "@/domain/shared/tenant";

import type { AiAgent } from "@/domain/ai-agent/ai-agent";
import type { AiAgentId } from "@/domain/ai-agent/ai-agent-id";
import type { ProjectId } from "@/domain/project/project-id";

type AiAgentRepository = {
  findById(input: {
    id: AiAgentId;
    tenant: Tenant;
  }): Promise<Result<AiAgent | null, DomainError>>;
  findMany(input: {
    tenant: Tenant;
    filter?: { projectId?: ProjectId };
  }): Promise<Result<readonly AiAgent[], DomainError>>;
  save(aggregate: AiAgent): Promise<Result<void, DomainError>>;
  delete(aggregate: AiAgent): Promise<Result<void, DomainError>>;
};

export type { AiAgentRepository };
