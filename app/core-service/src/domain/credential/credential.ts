import { AggregateRoot } from "@/domain/shared/aggregate-root";
import { createMetadata, type Metadata } from "@/domain/shared/metadata";
import type { Tenant } from "@/domain/shared/tenant";

import type { CredentialEvent } from "@/domain/credential/credential-events";
import type { CredentialId } from "@/domain/credential/credential-id";
import {
  CredentialExpiredError,
  CredentialTypeMismatchError,
} from "@/domain/credential/credential-errors";
import type {
  CredentialSecret,
  CredentialType,
} from "@/domain/credential/credential-value-objects";

type CredentialState = CredentialSecret;

class Credential extends AggregateRoot<CredentialId, CredentialEvent> {
  #state: CredentialState;

  protected constructor(input: {
    id: CredentialId;
    tenant: Tenant;
    metadata: Metadata;
    state: CredentialState;
  }) {
    super({ id: input.id, tenant: input.tenant, metadata: input.metadata });
    this.#state = input.state;
  }

  static create(input: {
    id: CredentialId;
    tenant: Tenant;
    secret: CredentialSecret;
    now: Date;
  }): Credential {
    const credential = new Credential({
      id: input.id,
      tenant: input.tenant,
      metadata: createMetadata(input.now),
      state: input.secret,
    });
    credential.raise({
      name: "CredentialCreated",
      aggregateId: input.id,
      occurredAt: input.now,
      payload: {
        credentialId: input.id,
        name: input.secret.name,
        type: input.secret.type,
      },
    });
    return credential;
  }

  static fromPersistence(input: {
    id: CredentialId;
    tenant: Tenant;
    metadata: Metadata;
    state: CredentialState;
  }): Credential {
    return new Credential(input);
  }

  get type(): CredentialType {
    return this.#state.type;
  }

  get name(): string {
    return this.#state.name;
  }

  get expiredAt(): Date {
    return this.#state.expiredAt;
  }

  get state(): Readonly<CredentialState> {
    return this.#state;
  }

  isExpired(now: Date): boolean {
    return now.getTime() >= this.#state.expiredAt.getTime();
  }

  assertNotExpired(now: Date): void {
    if (this.isExpired(now)) {
      throw new CredentialExpiredError(this.id);
    }
  }

  rotate(input: { secret: CredentialSecret; now: Date }): void {
    if (input.secret.type !== this.#state.type) {
      throw new CredentialTypeMismatchError(
        this.#state.type,
        input.secret.type,
      );
    }
    this.#state = input.secret;
    this.touch(input.now);
    this.raise({
      name: "CredentialRotated",
      aggregateId: this.id,
      occurredAt: input.now,
      payload: { credentialId: this.id, type: this.#state.type },
    });
  }

  rename(name: string, now: Date): void {
    if (name === this.#state.name) return;
    this.#state =
      this.#state.type === "apiKey"
        ? { ...this.#state, name }
        : { ...this.#state, name };
    this.touch(now);
    this.raise({
      name: "CredentialRenamed",
      aggregateId: this.id,
      occurredAt: now,
      payload: { credentialId: this.id, name },
    });
  }
}

export { Credential };
