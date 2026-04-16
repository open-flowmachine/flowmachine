const domainErrorCategories = [
  "not-found",
  "invariant-violated",
  "conflict",
  "invalid-transition",
  "infrastructure-failure",
] as const;
type DomainErrorCategory = (typeof domainErrorCategories)[number];

abstract class DomainError extends Error {
  abstract readonly category: DomainErrorCategory;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

class ConcurrencyConflictError extends DomainError {
  override readonly name = "ConcurrencyConflictError";
  readonly category = "conflict" as const;

  constructor(aggregateId: string, expectedVersion: number) {
    super(
      `Concurrent modification of ${aggregateId}: expected version ${expectedVersion}`,
    );
  }
}

class PersistenceError extends DomainError {
  override readonly name = "PersistenceError";
  readonly category = "infrastructure-failure" as const;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

export {
  DomainError,
  ConcurrencyConflictError,
  PersistenceError,
  domainErrorCategories,
};
export type { DomainErrorCategory };
