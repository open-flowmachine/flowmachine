import { DomainError } from "@/domain/shared/errors";

class AiAgentNotFoundError extends DomainError {
  override readonly name = "AiAgentNotFoundError";
  readonly category = "not-found" as const;

  constructor(id: string) {
    super(`AI agent "${id}" not found`);
  }
}

class UnsupportedAiModelError extends DomainError {
  override readonly name = "UnsupportedAiModelError";
  readonly category = "invariant-violated" as const;

  constructor(model: string) {
    super(`Unsupported AI model "${model}"`);
  }
}

class ProjectAlreadyLinkedError extends DomainError {
  override readonly name = "ProjectAlreadyLinkedError";
  readonly category = "conflict" as const;

  constructor(projectId: string) {
    super(`Project "${projectId}" is already linked to this AI agent`);
  }
}

class ProjectNotLinkedError extends DomainError {
  override readonly name = "ProjectNotLinkedError";
  readonly category = "not-found" as const;

  constructor(projectId: string) {
    super(`Project "${projectId}" is not linked to this AI agent`);
  }
}

export {
  AiAgentNotFoundError,
  ProjectAlreadyLinkedError,
  ProjectNotLinkedError,
  UnsupportedAiModelError,
};
