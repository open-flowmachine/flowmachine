import type { DomainError } from "@/domain/shared/errors";
import type { Result } from "@/domain/shared/result";
import type { Tenant } from "@/domain/shared/tenant";

import type { Credential } from "@/domain/credential/credential";
import type { CredentialId } from "@/domain/credential/credential-id";

type CredentialRepository = {
  findById(input: {
    id: CredentialId;
    tenant: Tenant;
  }): Promise<Result<Credential | null, DomainError>>;
  findMany(input: {
    tenant: Tenant;
  }): Promise<Result<readonly Credential[], DomainError>>;
  save(aggregate: Credential): Promise<Result<void, DomainError>>;
  delete(aggregate: Credential): Promise<Result<void, DomainError>>;
};

export type { CredentialRepository };
