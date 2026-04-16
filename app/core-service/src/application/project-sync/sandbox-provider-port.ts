import type { Result } from "@/domain/shared/result";

import type { WorkflowExecutionId } from "@/domain/workflow-execution/workflow-execution-id";
import type { SandboxProvider } from "@/domain/workflow-execution/workflow-execution-value-objects";

import type { ApplicationError } from "@/application/shared/errors";

type SandboxExternalRef = {
  readonly provider: SandboxProvider;
  readonly externalId: string;
};

type SandboxProviderPort = {
  createVolume(input: {
    executionId: WorkflowExecutionId;
  }): Promise<Result<SandboxExternalRef, ApplicationError>>;
  destroyVolume(input: {
    externalId: string;
  }): Promise<Result<void, ApplicationError>>;
  createSandbox(input: {
    executionId: WorkflowExecutionId;
    actionId: string;
  }): Promise<Result<SandboxExternalRef, ApplicationError>>;
  destroySandbox(input: {
    externalId: string;
  }): Promise<Result<void, ApplicationError>>;
};

export type { SandboxExternalRef, SandboxProviderPort };
