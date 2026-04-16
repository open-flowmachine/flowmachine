import { DomainError } from "@/domain/shared/errors";

class WorkflowDefinitionNotFoundError extends DomainError {
  override readonly name = "WorkflowDefinitionNotFoundError";
  readonly category = "not-found" as const;

  constructor(id: string) {
    super(`Workflow definition "${id}" not found`);
  }
}

class DuplicateActionIdError extends DomainError {
  override readonly name = "DuplicateActionIdError";
  readonly category = "invariant-violated" as const;

  constructor(actionId: string) {
    super(`Duplicate workflow action id "${actionId}"`);
  }
}

class DanglingEdgeError extends DomainError {
  override readonly name = "DanglingEdgeError";
  readonly category = "invariant-violated" as const;

  constructor(from: string, to: string) {
    super(
      `Workflow edge "${from} -> ${to}" references an action id that does not exist`,
    );
  }
}

class CycleDetectedError extends DomainError {
  override readonly name = "CycleDetectedError";
  readonly category = "invariant-violated" as const;

  constructor() {
    super("Workflow action graph contains a cycle");
  }
}

class ActionNotFoundError extends DomainError {
  override readonly name = "ActionNotFoundError";
  readonly category = "not-found" as const;

  constructor(actionId: string) {
    super(`Workflow action "${actionId}" not found`);
  }
}

class InactiveWorkflowCannotRunError extends DomainError {
  override readonly name = "InactiveWorkflowCannotRunError";
  readonly category = "invalid-transition" as const;

  constructor(id: string) {
    super(`Workflow definition "${id}" is inactive and cannot be executed`);
  }
}

export {
  ActionNotFoundError,
  CycleDetectedError,
  DanglingEdgeError,
  DuplicateActionIdError,
  InactiveWorkflowCannotRunError,
  WorkflowDefinitionNotFoundError,
};
