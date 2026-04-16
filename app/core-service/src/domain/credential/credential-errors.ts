import { DomainError } from "@/domain/shared/errors";

class CredentialNotFoundError extends DomainError {
  override readonly name = "CredentialNotFoundError";
  readonly category = "not-found" as const;

  constructor(id: string) {
    super(`Credential "${id}" not found`);
  }
}

class CredentialExpiredError extends DomainError {
  override readonly name = "CredentialExpiredError";
  readonly category = "invariant-violated" as const;

  constructor(id: string) {
    super(`Credential "${id}" has expired`);
  }
}

class CredentialTypeMismatchError extends DomainError {
  override readonly name = "CredentialTypeMismatchError";
  readonly category = "invariant-violated" as const;

  constructor(expected: string, actual: string) {
    super(`Credential type mismatch: expected "${expected}", got "${actual}"`);
  }
}

export {
  CredentialExpiredError,
  CredentialNotFoundError,
  CredentialTypeMismatchError,
};
