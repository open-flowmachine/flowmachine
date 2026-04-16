import { DomainError } from "@/domain/shared/errors";

class WorkflowExecutionNotFoundError extends DomainError {
  override readonly name = "WorkflowExecutionNotFoundError";
  readonly category = "not-found" as const;

  constructor(id: string) {
    super(`Workflow execution "${id}" not found`);
  }
}

class InvalidSandboxTransitionError extends DomainError {
  override readonly name = "InvalidSandboxTransitionError";
  readonly category = "invalid-transition" as const;

  constructor(from: string, to: string) {
    super(`Invalid sandbox transition: "${from}" -> "${to}"`);
  }
}

class ExecutionAlreadyCompletedError extends DomainError {
  override readonly name = "ExecutionAlreadyCompletedError";
  readonly category = "invalid-transition" as const;

  constructor(id: string, status: string) {
    super(`Workflow execution "${id}" is already in terminal state "${status}"`);
  }
}

class SandboxVolumeNotReadyError extends DomainError {
  override readonly name = "SandboxVolumeNotReadyError";
  readonly category = "invariant-violated" as const;

  constructor(volumeStatus: string) {
    super(
      `Cannot attach sandbox: volume must be in status "ready", got "${volumeStatus}"`,
    );
  }
}

class NoActiveSandboxError extends DomainError {
  override readonly name = "NoActiveSandboxError";
  readonly category = "invariant-violated" as const;

  constructor(id: string) {
    super(`Workflow execution "${id}" has no active sandbox to release`);
  }
}

export {
  ExecutionAlreadyCompletedError,
  InvalidSandboxTransitionError,
  NoActiveSandboxError,
  SandboxVolumeNotReadyError,
  WorkflowExecutionNotFoundError,
};
