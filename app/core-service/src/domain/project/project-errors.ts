import { DomainError } from "@/domain/shared/errors";

class ProjectNotFoundError extends DomainError {
  override readonly name = "ProjectNotFoundError";
  readonly category = "not-found" as const;

  constructor(id: string) {
    super(`Project "${id}" not found`);
  }
}

class ProjectIntegrationMissingError extends DomainError {
  override readonly name = "ProjectIntegrationMissingError";
  readonly category = "invariant-violated" as const;

  constructor(id: string) {
    super(`Project "${id}" has no external integration configured`);
  }
}

class InvalidProjectIntegrationError extends DomainError {
  override readonly name = "InvalidProjectIntegrationError";
  readonly category = "invariant-violated" as const;

  constructor(reason: string) {
    super(`Invalid project integration: ${reason}`);
  }
}

export {
  InvalidProjectIntegrationError,
  ProjectIntegrationMissingError,
  ProjectNotFoundError,
};
