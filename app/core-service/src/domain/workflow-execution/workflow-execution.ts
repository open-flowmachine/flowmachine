import { AggregateRoot } from "@/domain/shared/aggregate-root";
import { createMetadata, type Metadata } from "@/domain/shared/metadata";
import type { Tenant } from "@/domain/shared/tenant";

import {
  ExecutionAlreadyCompletedError,
  InvalidSandboxTransitionError,
  NoActiveSandboxError,
  SandboxVolumeNotReadyError,
} from "@/domain/workflow-execution/workflow-execution-errors";
import type { WorkflowExecutionEvent } from "@/domain/workflow-execution/workflow-execution-events";
import type { WorkflowExecutionId } from "@/domain/workflow-execution/workflow-execution-id";
import type {
  CurrentSandbox,
  ExecutionStatus,
  SandboxProvider,
  Volume,
  WorkflowDefinitionSnapshot,
  WorkflowExecutionIntegration,
  WorkflowExecutionSandbox,
} from "@/domain/workflow-execution/workflow-execution-value-objects";

type WorkflowExecutionState = {
  status: ExecutionStatus;
  integration: WorkflowExecutionIntegration;
  workflowDefinition: WorkflowDefinitionSnapshot;
  sandbox: WorkflowExecutionSandbox | null;
};

const terminalStatuses: readonly ExecutionStatus[] = [
  "succeeded",
  "failed",
  "cancelled",
];

class WorkflowExecution extends AggregateRoot<
  WorkflowExecutionId,
  WorkflowExecutionEvent
> {
  #state: WorkflowExecutionState;

  protected constructor(input: {
    id: WorkflowExecutionId;
    tenant: Tenant;
    metadata: Metadata;
    state: WorkflowExecutionState;
  }) {
    super({ id: input.id, tenant: input.tenant, metadata: input.metadata });
    this.#state = input.state;
  }

  static initialize(input: {
    id: WorkflowExecutionId;
    tenant: Tenant;
    integration: WorkflowExecutionIntegration;
    workflowDefinition: WorkflowDefinitionSnapshot;
    now: Date;
  }): WorkflowExecution {
    const execution = new WorkflowExecution({
      id: input.id,
      tenant: input.tenant,
      metadata: createMetadata(input.now),
      state: {
        status: "initialized",
        integration: input.integration,
        workflowDefinition: input.workflowDefinition,
        sandbox: null,
      },
    });
    execution.raise({
      name: "WorkflowExecutionInitialized",
      aggregateId: input.id,
      occurredAt: input.now,
      payload: {
        workflowExecutionId: input.id,
        integration: input.integration,
        workflowDefinition: input.workflowDefinition,
      },
    });
    return execution;
  }

  static fromPersistence(input: {
    id: WorkflowExecutionId;
    tenant: Tenant;
    metadata: Metadata;
    state: WorkflowExecutionState;
  }): WorkflowExecution {
    return new WorkflowExecution(input);
  }

  get status(): ExecutionStatus {
    return this.#state.status;
  }
  get integration(): WorkflowExecutionIntegration {
    return this.#state.integration;
  }
  get workflowDefinition(): WorkflowDefinitionSnapshot {
    return this.#state.workflowDefinition;
  }
  get sandbox(): WorkflowExecutionSandbox | null {
    return this.#state.sandbox;
  }

  #assertNotTerminal(): void {
    if (terminalStatuses.includes(this.#state.status)) {
      throw new ExecutionAlreadyCompletedError(this.id, this.#state.status);
    }
  }

  start(now: Date): void {
    this.#assertNotTerminal();
    if (this.#state.status === "running") return;
    if (this.#state.status !== "initialized") {
      throw new InvalidSandboxTransitionError(this.#state.status, "running");
    }
    this.#state = { ...this.#state, status: "running" };
    this.touch(now);
    this.raise({
      name: "WorkflowExecutionStarted",
      aggregateId: this.id,
      occurredAt: now,
      payload: { workflowExecutionId: this.id },
    });
  }

  requestVolume(
    input: { provider: SandboxProvider; externalId: string },
    now: Date,
  ): void {
    this.#assertNotTerminal();
    const volume: Volume = {
      integration: { provider: input.provider, externalId: input.externalId },
      status: "creating",
    };
    this.#state = {
      ...this.#state,
      sandbox: { volume, currentSandbox: null },
    };
    this.touch(now);
    this.raise({
      name: "SandboxVolumeRequested",
      aggregateId: this.id,
      occurredAt: now,
      payload: { workflowExecutionId: this.id },
    });
  }

  markVolumeReady(now: Date): void {
    this.#assertNotTerminal();
    const sandbox = this.#state.sandbox;
    if (!sandbox) {
      throw new InvalidSandboxTransitionError("<no-volume>", "ready");
    }
    if (sandbox.volume.status !== "creating") {
      throw new InvalidSandboxTransitionError(sandbox.volume.status, "ready");
    }
    this.#state = {
      ...this.#state,
      sandbox: {
        ...sandbox,
        volume: { ...sandbox.volume, status: "ready" },
      },
    };
    this.touch(now);
    this.raise({
      name: "SandboxVolumeReady",
      aggregateId: this.id,
      occurredAt: now,
      payload: { workflowExecutionId: this.id },
    });
  }

  markVolumeFailed(now: Date): void {
    this.#assertNotTerminal();
    const sandbox = this.#state.sandbox;
    if (!sandbox) {
      throw new InvalidSandboxTransitionError("<no-volume>", "failed");
    }
    this.#state = {
      ...this.#state,
      sandbox: {
        ...sandbox,
        volume: { ...sandbox.volume, status: "failed" },
      },
    };
    this.touch(now);
    this.raise({
      name: "SandboxVolumeFailed",
      aggregateId: this.id,
      occurredAt: now,
      payload: { workflowExecutionId: this.id },
    });
  }

  attachSandbox(
    input: {
      provider: SandboxProvider;
      externalId: string;
      actionId: string;
    },
    now: Date,
  ): void {
    this.#assertNotTerminal();
    const sandbox = this.#state.sandbox;
    if (!sandbox || sandbox.volume.status !== "ready") {
      throw new SandboxVolumeNotReadyError(
        sandbox?.volume.status ?? "<no-volume>",
      );
    }
    const currentSandbox: CurrentSandbox = {
      integration: { provider: input.provider, externalId: input.externalId },
      status: "running",
      actionId: input.actionId,
    };
    this.#state = {
      ...this.#state,
      sandbox: { ...sandbox, currentSandbox },
    };
    this.touch(now);
    this.raise({
      name: "SandboxAttached",
      aggregateId: this.id,
      occurredAt: now,
      payload: {
        workflowExecutionId: this.id,
        actionId: input.actionId,
        externalId: input.externalId,
      },
    });
  }

  releaseSandbox(now: Date): void {
    this.#assertNotTerminal();
    const sandbox = this.#state.sandbox;
    if (!sandbox || !sandbox.currentSandbox) {
      throw new NoActiveSandboxError(this.id);
    }
    const actionId = sandbox.currentSandbox.actionId;
    this.#state = {
      ...this.#state,
      sandbox: { ...sandbox, currentSandbox: null },
    };
    this.touch(now);
    this.raise({
      name: "SandboxReleased",
      aggregateId: this.id,
      occurredAt: now,
      payload: { workflowExecutionId: this.id, actionId },
    });
  }

  complete(now: Date): void {
    this.#assertNotTerminal();
    this.#state = { ...this.#state, status: "succeeded" };
    this.touch(now);
    this.raise({
      name: "WorkflowExecutionCompleted",
      aggregateId: this.id,
      occurredAt: now,
      payload: { workflowExecutionId: this.id, status: "succeeded" },
    });
  }

  fail(reason: string, now: Date): void {
    this.#assertNotTerminal();
    this.#state = { ...this.#state, status: "failed" };
    this.touch(now);
    this.raise({
      name: "WorkflowExecutionFailed",
      aggregateId: this.id,
      occurredAt: now,
      payload: { workflowExecutionId: this.id, reason },
    });
  }
}

export { WorkflowExecution };
