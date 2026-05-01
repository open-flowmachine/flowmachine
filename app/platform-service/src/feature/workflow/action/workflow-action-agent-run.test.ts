import { afterAll, beforeEach, expect, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

import {
  AI_AGENT_RUN_STARTED_EVENT,
  AI_AGENT_RUN_TERMINATED_EVENT,
} from "@/feature/ai-agent-conversation/ai-agent-conversation-constant";
import { aiAgentRunRepository } from "@/module/ai-agent-run/ai-agent-run-repository";
import { Err } from "@/shared/err/err";
import * as modelIdModule from "@/shared/model/model-id";

// --- Mock setup ---

const TENANT_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const WORKFLOW_EXECUTION_ID = "019606a0-0000-7000-8000-000000000002" as Id;
const AGENT_ID = "019606a0-0000-7000-8000-000000000020" as Id;
const NEW_RUN_ID = "019606a0-0000-7000-8000-000000000099" as Id;
const TENANT: Tenant = { id: TENANT_ID, type: "organization" };

const mockRepoFindMany = spyOn(aiAgentRunRepository, "findMany");
const mockRepoInsert = spyOn(aiAgentRunRepository, "insert");
const newIdSpy = spyOn(modelIdModule, "newId");

const { agentRunAction } = await import(
  "@/feature/workflow/action/workflow-action-agent-run"
);

// --- Helpers ---

type StepRunCall = { name: string };
type StepSendEventCall = {
  name: string;
  payload: { name: string; data: Record<string, unknown> };
};
type StepWaitForEventCall = {
  name: string;
  options: Record<string, unknown>;
};

type FakeStep = {
  run: (name: string, fn: () => Promise<unknown>) => Promise<unknown>;
  sendEvent: (
    name: string,
    payload: { name: string; data: Record<string, unknown> },
  ) => Promise<void>;
  waitForEvent: (
    name: string,
    options: Record<string, unknown>,
  ) => Promise<unknown>;
};

const makeFakeStep = (
  options: { waitForEventResult?: unknown } = {},
): {
  step: FakeStep;
  runCalls: StepRunCall[];
  sendEventCalls: StepSendEventCall[];
  waitForEventCalls: StepWaitForEventCall[];
} => {
  const runCalls: StepRunCall[] = [];
  const sendEventCalls: StepSendEventCall[] = [];
  const waitForEventCalls: StepWaitForEventCall[] = [];
  const step: FakeStep = {
    run: async (name, fn) => {
      runCalls.push({ name });
      return await fn();
    },
    sendEvent: async (name, payload) => {
      sendEventCalls.push({ name, payload });
    },
    waitForEvent: async (name, opts) => {
      waitForEventCalls.push({ name, options: opts });
      return options.waitForEventResult ?? null;
    },
  };
  return { step, runCalls, sendEventCalls, waitForEventCalls };
};

const makeArgs = (input: {
  step: FakeStep;
  eventData?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
}) => ({
  event: { data: input.eventData ?? defaultEventData() },
  step: input.step as unknown,
  workflow: { actions: [], edges: [] },
  workflowAction: {
    id: "action-1",
    kind: "agent-run",
    inputs: input.inputs ?? defaultInputs(),
  },
  state: new Map(),
});

const defaultEventData = () => ({
  tenant: TENANT,
  workflowExecutionId: WORKFLOW_EXECUTION_ID,
});

const defaultInputs = (
  overrides: Partial<{
    aiAgentId: Id;
    initialMessage: string;
    mode: "fire-and-forget" | "interactive";
  }> = {},
) => ({
  aiAgentId: AGENT_ID,
  initialMessage: "hello agent",
  mode: "fire-and-forget" as const,
  ...overrides,
});

const invokeHandler = (args: ReturnType<typeof makeArgs>) => {
  const handler = agentRunAction.handler as (a: {
    event: unknown;
    step: unknown;
    workflow: unknown;
    workflowAction: unknown;
    state: unknown;
  }) => Promise<unknown>;
  return handler(args);
};

const setHappyRunCreate = () => {
  mockRepoFindMany.mockResolvedValue(ok({ data: [] }));
  mockRepoInsert.mockResolvedValue(ok());
};

const resetMocks = () => {
  mockRepoFindMany.mockReset();
  mockRepoInsert.mockReset();
  newIdSpy.mockReset();
  newIdSpy.mockReturnValue(NEW_RUN_ID);
};

// --- Tests ---

beforeEach(resetMocks);

afterAll(() => {
  mockRepoFindMany.mockRestore();
  mockRepoInsert.mockRestore();
  newIdSpy.mockRestore();
});

test("agentRunAction: given valid inputs in fire-and-forget mode, when handled, then creates a run, emits run.started, and does not wait", async () => {
  // given
  setHappyRunCreate();
  const { step, runCalls, sendEventCalls, waitForEventCalls } = makeFakeStep();

  // when
  const result = await invokeHandler(
    makeArgs({
      step,
      inputs: defaultInputs({ mode: "fire-and-forget" }),
    }),
  );

  // then
  expect(result).toEqual({ aiAgentRunId: NEW_RUN_ID });
  expect(runCalls.map((c) => c.name)).toEqual(["create-ai-agent-run"]);
  expect(mockRepoInsert).toHaveBeenCalledTimes(1);
  expect(sendEventCalls).toHaveLength(1);
  expect(sendEventCalls[0]).toEqual({
    name: "trigger-ai-agent-run",
    payload: {
      name: AI_AGENT_RUN_STARTED_EVENT,
      data: {
        tenant: TENANT,
        aiAgentId: AGENT_ID,
        aiAgentRunId: NEW_RUN_ID,
        initialMessage: "hello agent",
      },
    },
  });
  expect(waitForEventCalls).toHaveLength(0);
});

test("agentRunAction: given valid inputs in interactive mode, when handled, then creates a run, emits run.started, and waits for run.terminated", async () => {
  // given
  setHappyRunCreate();
  const { step, runCalls, sendEventCalls, waitForEventCalls } = makeFakeStep({
    waitForEventResult: {
      data: { aiAgentRunId: NEW_RUN_ID, status: "stopped" },
    },
  });

  // when
  const result = await invokeHandler(
    makeArgs({
      step,
      inputs: defaultInputs({ mode: "interactive" }),
    }),
  );

  // then
  expect(result).toEqual({ aiAgentRunId: NEW_RUN_ID });
  expect(runCalls.map((c) => c.name)).toEqual(["create-ai-agent-run"]);
  expect(sendEventCalls).toHaveLength(1);
  expect(waitForEventCalls).toHaveLength(1);
  expect(waitForEventCalls[0]).toEqual({
    name: "wait-for-agent-run-terminated",
    options: {
      event: AI_AGENT_RUN_TERMINATED_EVENT,
      match: "data.aiAgentRunId",
      timeout: "30d",
    },
  });
});

test("agentRunAction: given invalid event data, when handled, then returns without creating a run", async () => {
  // given
  const { step, runCalls, sendEventCalls } = makeFakeStep();

  // when
  const result = await invokeHandler(
    makeArgs({ step, eventData: { not: "valid" } }),
  );

  // then
  expect(result).toBeUndefined();
  expect(runCalls).toHaveLength(0);
  expect(sendEventCalls).toHaveLength(0);
  expect(mockRepoInsert).not.toHaveBeenCalled();
});

const captureThrow = async (
  promise: Promise<unknown>,
): Promise<unknown> => {
  try {
    await promise;
    return undefined;
  } catch (e) {
    return e;
  }
};

test("agentRunAction: given invalid action inputs, when handled, then throws and does not create a run", async () => {
  // given
  const { step, runCalls, sendEventCalls } = makeFakeStep();

  // when
  const thrown = await captureThrow(
    invokeHandler(makeArgs({ step, inputs: { aiAgentId: "not-a-uuid" } })),
  );

  // then
  expect(thrown).toBeInstanceOf(Err);
  expect(runCalls).toHaveLength(0);
  expect(sendEventCalls).toHaveLength(0);
  expect(mockRepoInsert).not.toHaveBeenCalled();
});

test("agentRunAction: given the run-creation service returns err, when handled, then throws and does not emit run.started", async () => {
  // given
  mockRepoFindMany.mockResolvedValue(
    ok({ data: [{ status: "processing" }] as never }),
  );
  const { step, sendEventCalls } = makeFakeStep();

  // when
  const thrown = await captureThrow(invokeHandler(makeArgs({ step })));

  // then
  expect(thrown).toBeInstanceOf(Err);
  expect(sendEventCalls).toHaveLength(0);
});

test("agentRunAction: given the repository insert fails, when handled, then throws and does not emit run.started", async () => {
  // given
  mockRepoFindMany.mockResolvedValue(ok({ data: [] }));
  mockRepoInsert.mockResolvedValue(
    err(Err.code("unknown", { message: "mongo down" })),
  );
  const { step, sendEventCalls } = makeFakeStep();

  // when
  const thrown = await captureThrow(invokeHandler(makeArgs({ step })));

  // then
  expect(thrown).toBeInstanceOf(Err);
  expect(sendEventCalls).toHaveLength(0);
});
