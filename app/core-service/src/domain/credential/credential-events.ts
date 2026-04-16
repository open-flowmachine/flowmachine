import type { DomainEvent } from "@/domain/shared/domain-event";

import type { CredentialId } from "@/domain/credential/credential-id";
import type { CredentialType } from "@/domain/credential/credential-value-objects";

type CredentialCreated = DomainEvent<
  "CredentialCreated",
  {
    readonly credentialId: CredentialId;
    readonly name: string;
    readonly type: CredentialType;
  }
>;

type CredentialRotated = DomainEvent<
  "CredentialRotated",
  {
    readonly credentialId: CredentialId;
    readonly type: CredentialType;
  }
>;

type CredentialRenamed = DomainEvent<
  "CredentialRenamed",
  {
    readonly credentialId: CredentialId;
    readonly name: string;
  }
>;

type CredentialRevoked = DomainEvent<
  "CredentialRevoked",
  {
    readonly credentialId: CredentialId;
  }
>;

type CredentialEvent =
  | CredentialCreated
  | CredentialRotated
  | CredentialRenamed
  | CredentialRevoked;

export type {
  CredentialCreated,
  CredentialEvent,
  CredentialRenamed,
  CredentialRevoked,
  CredentialRotated,
};
