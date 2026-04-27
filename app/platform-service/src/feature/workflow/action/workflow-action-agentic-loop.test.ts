import { afterAll, beforeEach, expect, mock, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

import { workflowExecutionRepository } from "@/module/workflow/workflow-execution-repository";
import { Err } from "@/shared/err/err";
import { daytonaClient } from "@/vendor/daytona/daytona-client";

// --- Mock setup ---

const TENANT_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const WORKFLOW_EXECUTION_ID = "019606a0-0000-7000-8000-000000000002" as Id;
const SANDBOX_ID = "sandbox-abc-123";
const TENANT: Tenant = { id: TENANT_ID, type: "organization" };

const mockRepoFindById = spyOn(workflowExecutionRepository, "findById");
const mockRepoUpdate = spyOn(workflowExecutionRepository, "update");

const mockDaytonaCreate = spyOn(daytonaClient, "create");
const mockDaytonaGet = spyOn(daytonaClient, "get");
const mockDaytonaStop = spyOn(daytonaClient, "stop");
const mockSandboxExecuteCommand = mock();

const { agenticLoopAction } = await import(
  "@/feature/workflow/action/workflow-action-agentic-loop"
);

// --- Helpers ---

type FakeStep = {
  run: (name: string, fn: () => unknown | Promise<unknown>) => Promise<unknown>;
  sendEvent: ReturnType<typeof mock>;
};

const makeFakeStep = (): { step: FakeStep; stepRunNames: string[] } => {
  const stepRunNames: string[] = [];
  const step: FakeStep = {
    run: async (name, fn) => {
      stepRunNames.push(name);
      return await fn();
    },
    sendEvent: mock(),
  };
  return { step, stepRunNames };
};

const makeEvent = (
  data: Record<string, unknown> = {
    tenant: TENANT,
    workflowExecutionId: WORKFLOW_EXECUTION_ID,
  },
) => ({ data });

const invokeHandler = (event: ReturnType<typeof makeEvent>, step: FakeStep) => {
  // The EngineAction handler is a plain async function; feed it a minimal
  // ActionHandlerArgs shape (event + step).
  const handler = agenticLoopAction.handler as (args: {
    event: unknown;
    step: unknown;
  }) => Promise<unknown>;
  return handler({ event, step });
};

const resetMocks = () => {
  mockRepoFindById.mockReset();
  mockRepoUpdate.mockReset();
  mockDaytonaCreate.mockReset();
  mockDaytonaGet.mockReset();
  mockDaytonaStop.mockReset();
  mockSandboxExecuteCommand.mockReset();
  // The service.update flow does findById first; default to a found row so
  // repo.update is the failure point we control per-test.
  mockRepoFindById.mockResolvedValue(ok({ data: { id: WORKFLOW_EXECUTION_ID } }) as never);
};

const setDaytonaHappyPath = () => {
  mockDaytonaCreate.mockResolvedValue({ id: SANDBOX_ID } as never);
  mockSandboxExecuteCommand.mockResolvedValue({ result: "/workspace" });
  mockDaytonaGet.mockResolvedValue({
    id: SANDBOX_ID,
    process: { executeCommand: mockSandboxExecuteCommand },
  } as never);
  mockDaytonaStop.mockResolvedValue(undefined as never);
};

// --- Tests ---

beforeEach(resetMocks);

afterAll(() => {
  mockRepoFindById.mockRestore();
  mockRepoUpdate.mockRestore();
  mockDaytonaCreate.mockRestore();
  mockDaytonaGet.mockRestore();
  mockDaytonaStop.mockRestore();
});

test("agenticLoopAction: given valid event data, when handled, then creates sandbox, marks running, execs pwd, stops sandbox, marks destroyed", async () => {
  // given
  setDaytonaHappyPath();
  mockRepoUpdate.mockResolvedValue(ok({ data: {} }) as never);
  const { step, stepRunNames } = makeFakeStep();

  // when
  await invokeHandler(makeEvent(), step);

  // then
  expect(stepRunNames).toEqual([
    "daytona-create-sandbox",
    "mark-sandbox-running",
    "daytona-exec-pwd",
    "daytona-stop-sandbox",
    "mark-sandbox-destroyed",
  ]);
  expect(mockDaytonaCreate).toHaveBeenCalledTimes(1);
  expect(mockDaytonaGet).toHaveBeenCalledTimes(2);
  expect(mockDaytonaGet).toHaveBeenNthCalledWith(1, SANDBOX_ID);
  expect(mockDaytonaGet).toHaveBeenNthCalledWith(2, SANDBOX_ID);
  expect(mockSandboxExecuteCommand).toHaveBeenCalledWith("pwd");
  expect(mockDaytonaStop).toHaveBeenCalledTimes(1);
  expect(mockRepoUpdate).toHaveBeenCalledTimes(2);
  expect(mockRepoUpdate).toHaveBeenNthCalledWith(1, {
    ctx: { tenant: TENANT },
    id: WORKFLOW_EXECUTION_ID,
    data: {
      sandbox: {
        volume: {
          integration: { externalId: "stub", provider: "daytona" },
          status: "ready",
        },
        currentSandbox: {
          integration: { externalId: SANDBOX_ID, provider: "daytona" },
          status: "running",
          actionId: "agentic-loop",
        },
      },
    },
  });
  expect(mockRepoUpdate).toHaveBeenNthCalledWith(2, {
    ctx: { tenant: TENANT },
    id: WORKFLOW_EXECUTION_ID,
    data: {
      sandbox: {
        volume: {
          integration: { externalId: "stub", provider: "daytona" },
          status: "ready",
        },
        currentSandbox: {
          integration: { externalId: SANDBOX_ID, provider: "daytona" },
          status: "destroyed",
          actionId: "agentic-loop",
        },
      },
    },
  });
});

test("agenticLoopAction: given invalid event data, when handled, then returns without touching daytona or the execution repository", async () => {
  // given
  const { step, stepRunNames } = makeFakeStep();

  // when
  await invokeHandler(makeEvent({}), step);

  // then
  expect(stepRunNames).toEqual([]);
  expect(mockDaytonaCreate).not.toHaveBeenCalled();
  expect(mockDaytonaGet).not.toHaveBeenCalled();
  expect(mockDaytonaStop).not.toHaveBeenCalled();
  expect(mockRepoUpdate).not.toHaveBeenCalled();
});

test("agenticLoopAction: given the running-status update returns an error, when handled, then throws before running pwd", async () => {
  // given
  setDaytonaHappyPath();
  mockRepoUpdate.mockResolvedValueOnce(
    err(Err.code("unknown", { message: "update failed" })) as never,
  );
  const { step } = makeFakeStep();

  // when / then
  await expect(invokeHandler(makeEvent(), step)).rejects.toBeInstanceOf(Err);
  expect(mockDaytonaCreate).toHaveBeenCalledTimes(1);
  expect(mockSandboxExecuteCommand).not.toHaveBeenCalled();
  expect(mockDaytonaStop).not.toHaveBeenCalled();
  expect(mockRepoUpdate).toHaveBeenCalledTimes(1);
});

test("agenticLoopAction: given the destroyed-status update returns an error, when handled, then throws after the sandbox is stopped", async () => {
  // given
  setDaytonaHappyPath();
  mockRepoUpdate
    .mockResolvedValueOnce(ok({ data: {} }) as never)
    .mockResolvedValueOnce(err(Err.code("unknown")) as never);
  const { step } = makeFakeStep();

  // when / then
  await expect(invokeHandler(makeEvent(), step)).rejects.toBeInstanceOf(Err);
  expect(mockDaytonaStop).toHaveBeenCalledTimes(1);
  expect(mockSandboxExecuteCommand).toHaveBeenCalledWith("pwd");
  expect(mockRepoUpdate).toHaveBeenCalledTimes(2);
});
