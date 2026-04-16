import type { Result } from "@/domain/shared/result";
import type { Tenant } from "@/domain/shared/tenant";

import type { Credential } from "@/domain/credential/credential";
import type { CredentialId } from "@/domain/credential/credential-id";
import type { CredentialSecret } from "@/domain/credential/credential-value-objects";

import type { ApplicationError } from "@/application/shared/errors";

type CreateCredentialCommand = {
  tenant: Tenant;
  secret: CredentialSecret;
};
type CreateCredentialOutput = { id: CredentialId };
type CreateCredentialUseCase = {
  execute(
    command: CreateCredentialCommand,
  ): Promise<Result<CreateCredentialOutput, ApplicationError>>;
};

type GetCredentialCommand = { tenant: Tenant; id: CredentialId };
type GetCredentialOutput = { credential: Credential };
type GetCredentialUseCase = {
  execute(
    command: GetCredentialCommand,
  ): Promise<Result<GetCredentialOutput, ApplicationError>>;
};

type ListCredentialsCommand = { tenant: Tenant };
type ListCredentialsOutput = { credentials: readonly Credential[] };
type ListCredentialsUseCase = {
  execute(
    command: ListCredentialsCommand,
  ): Promise<Result<ListCredentialsOutput, ApplicationError>>;
};

type RotateCredentialCommand = {
  tenant: Tenant;
  id: CredentialId;
  secret: CredentialSecret;
};
type RotateCredentialUseCase = {
  execute(
    command: RotateCredentialCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type RenameCredentialCommand = {
  tenant: Tenant;
  id: CredentialId;
  name: string;
};
type RenameCredentialUseCase = {
  execute(
    command: RenameCredentialCommand,
  ): Promise<Result<void, ApplicationError>>;
};

type DeleteCredentialCommand = { tenant: Tenant; id: CredentialId };
type DeleteCredentialUseCase = {
  execute(
    command: DeleteCredentialCommand,
  ): Promise<Result<void, ApplicationError>>;
};

export type {
  CreateCredentialCommand,
  CreateCredentialOutput,
  CreateCredentialUseCase,
  DeleteCredentialCommand,
  DeleteCredentialUseCase,
  GetCredentialCommand,
  GetCredentialOutput,
  GetCredentialUseCase,
  ListCredentialsCommand,
  ListCredentialsOutput,
  ListCredentialsUseCase,
  RenameCredentialCommand,
  RenameCredentialUseCase,
  RotateCredentialCommand,
  RotateCredentialUseCase,
};
