import { DomainError } from "@/domain/shared/errors";

class IssueFieldDefinitionNotFoundError extends DomainError {
  override readonly name = "IssueFieldDefinitionNotFoundError";
  readonly category = "not-found" as const;

  constructor(id: string) {
    super(`Issue field definition "${id}" not found`);
  }
}

class EmptyOptionsError extends DomainError {
  override readonly name = "EmptyOptionsError";
  readonly category = "invariant-violated" as const;

  constructor() {
    super("Issue field definition of type 'select' requires at least one option");
  }
}

class DuplicateOptionValueError extends DomainError {
  override readonly name = "DuplicateOptionValueError";
  readonly category = "invariant-violated" as const;

  constructor(value: string) {
    super(`Duplicate option value "${value}" in issue field definition`);
  }
}

class ProviderMismatchError extends DomainError {
  override readonly name = "ProviderMismatchError";
  readonly category = "invariant-violated" as const;

  constructor(expected: string, actual: string) {
    super(`Provider mismatch: expected "${expected}", got "${actual}"`);
  }
}

export {
  DuplicateOptionValueError,
  EmptyOptionsError,
  IssueFieldDefinitionNotFoundError,
  ProviderMismatchError,
};
