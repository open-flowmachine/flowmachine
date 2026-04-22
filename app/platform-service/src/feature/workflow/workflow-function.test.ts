import { InngestTestEngine } from "@inngest/test";
import { beforeEach, expect, mock, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

import {
  WORKFLOW_EXECUTION_INITIALIZED_EVENT,
  WORKFLOW_EXECUTION_TRIGGERED_EVENT,
} from "@/feature/workflow/workflow-constant";
import { Err } from "@/shared/err/err";

// --- Mock setup ---

const TENANT_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const WORKFLOW_DEFINITION_ID = "019606a0-0000-7000-8000-000000000002" as Id;
const WORKFLOW_EXECUTION_ID = "019606a0-0000-7000-8000-000000000003" as Id;
const TENANT: Tenant = { id: TENANT_ID, type: "organization" };

const mockCreateWorkflowExecution = mock();

mock.module("@/module/workflow/workflow-execution-service", () => ({
  makeWorkflowExecutionService: () => ({
    create: mockCreateWorkflowExecution,
    get: mock(),
    list: mock(),
    update: mock(),
    delete: mock(),
  }),
}));

mock.module("@/feature/workflow/workflow-engine", () => ({
  workflowEngine: { run: mock() },
}));

const { workflowFunctions } = await import(
  "@/feature/workflow/workflow-function"
);
const initializeWorkflowExecution = workflowFunctions[0];
if (!initializeWorkflowExecution) {
  throw new Error(
    "workflowFunctions[0] is missing; expected initializeWorkflowExecution",
  );
}

// --- Helpers ---

const resetMocks = () => {
  mockCreateWorkflowExecution.mockReset();
};

const makeEngine = () =>
  new InngestTestEngine({ function: initializeWorkflowExecution });

type TriggerEvent = {
  name: string;
  data: Record<string, unknown>;
  id?: string | undefined;
};

const triggerEvent = (
  data: Record<string, unknown>,
  overrides: { id?: string | undefined } = {},
): TriggerEvent => ({
  name: WORKFLOW_EXECUTION_TRIGGERED_EVENT,
  data,
  id: overrides.id,
});

// `ctx.step.*` are tinyspy mocks (from @inngest/test), not Bun mocks, so Bun's
// `toHaveBeenCalled` matchers don't recognise them. Read `.mock.calls` directly.
type TinySpy = { mock: { calls: unknown[][] } };
const spy = (fn: unknown) => fn as unknown as TinySpy;

// --- Tests ---

beforeEach(resetMocks);

test("initializeWorkflowExecution: given valid event data, when executed, then creates the workflow execution and sends the initialized event with workflowExecutionId", async () => {
  // given
  mockCreateWorkflowExecution.mockResolvedValue(
    ok({ id: WORKFLOW_EXECUTION_ID }),
  );
  const engine = makeEngine();

  // when
  const { ctx } = await engine.execute({
    events: [
      triggerEvent(
        {
          tenant: TENANT,
          workflowDefinitionId: WORKFLOW_DEFINITION_ID,
          title: "a title",
          summary: "a summary",
        },
        { id: "evt_123" },
      ),
    ],
  });

  // then
  expect(mockCreateWorkflowExecution).toHaveBeenCalledTimes(1);
  expect(mockCreateWorkflowExecution).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    payload: {
      integration: { externalId: "evt_123", provider: "inngest" },
      workflowDefinition: { id: WORKFLOW_DEFINITION_ID, raw: {} },
    },
  });
  const sendEventCalls = spy(ctx.step.sendEvent).mock.calls;
  expect(sendEventCalls).toHaveLength(1);
  expect(sendEventCalls[0]).toEqual([
    `send-${WORKFLOW_EXECUTION_INITIALIZED_EVENT}`,
    {
      name: WORKFLOW_EXECUTION_INITIALIZED_EVENT,
      data: {
        tenant: TENANT,
        workflowDefinitionId: WORKFLOW_DEFINITION_ID,
        workflowExecutionId: WORKFLOW_EXECUTION_ID,
        title: "a title",
        summary: "a summary",
      },
    },
  ]);
});

test("initializeWorkflowExecution: given invalid event data, when executed, then does not create an execution and does not send the initialized event", async () => {
  // given
  const engine = makeEngine();

  // when
  const { ctx } = await engine.execute({
    events: [triggerEvent({ tenant: "not-a-tenant" })],
  });

  // then
  expect(mockCreateWorkflowExecution).not.toHaveBeenCalled();
  expect(spy(ctx.step.sendEvent).mock.calls).toHaveLength(0);
});

test("initializeWorkflowExecution: given the execution service returns an error, when executed, then the run surfaces the mapped Err and does not send the initialized event", async () => {
  // given
  mockCreateWorkflowExecution.mockResolvedValue(
    err(Err.code("unknown", { message: "insert failed" })),
  );
  const engine = makeEngine();

  // when
  const { ctx, error, result } = await engine.execute({
    events: [
      triggerEvent({
        tenant: TENANT,
        workflowDefinitionId: WORKFLOW_DEFINITION_ID,
      }),
    ],
  });

  // then: Inngest serializes thrown errors across the step boundary, so the
  // surfaced `error` is a plain object carrying the original code + message.
  expect(result).toBeUndefined();
  expect(error).toMatchObject({
    code: "unknown",
    message: "insert failed",
  });
  expect(spy(ctx.step.sendEvent).mock.calls).toHaveLength(0);
});

test("initializeWorkflowExecution: given event.id is undefined, when executed, then externalId falls back to an empty string", async () => {
  // given
  mockCreateWorkflowExecution.mockResolvedValue(
    ok({ id: WORKFLOW_EXECUTION_ID }),
  );
  const engine = makeEngine();

  // when
  await engine.execute({
    events: [
      triggerEvent(
        {
          tenant: TENANT,
          workflowDefinitionId: WORKFLOW_DEFINITION_ID,
        },
        { id: undefined },
      ),
    ],
  });

  // then
  expect(mockCreateWorkflowExecution).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    payload: {
      integration: { externalId: "", provider: "inngest" },
      workflowDefinition: { id: WORKFLOW_DEFINITION_ID, raw: {} },
    },
  });
});
