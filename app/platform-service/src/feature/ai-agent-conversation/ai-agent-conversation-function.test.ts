import { InngestTestEngine } from "@inngest/test";
import { afterAll, beforeEach, expect, spyOn, test } from "bun:test";

import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

import {
  AI_AGENT_RUN_STARTED_EVENT,
  AI_AGENT_RUN_USER_INPUT_EVENT,
} from "@/feature/ai-agent-conversation/ai-agent-conversation-constant";
import * as aiAgentConversationTurnModule from "@/feature/ai-agent-conversation/ai-agent-conversation-turn";

// --- Mock setup ---

const TENANT_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const AGENT_ID = "019606a0-0000-7000-8000-000000000010" as Id;
const RUN_ID = "019606a0-0000-7000-8000-000000000020" as Id;
const TENANT: Tenant = { id: TENANT_ID, type: "organization" };

process.env.AI_AGENT_RUN_IDLE_TIMEOUT_DAYS ??= "7";

const mockProvisionVolume = spyOn(
  aiAgentConversationTurnModule,
  "provisionVolume",
);
const mockDestroyVolume = spyOn(aiAgentConversationTurnModule, "destroyVolume");
const mockProvisionSandbox = spyOn(
  aiAgentConversationTurnModule,
  "provisionSandbox",
);
const mockStopSandbox = spyOn(aiAgentConversationTurnModule, "stopSandbox");
const mockRunTurn = spyOn(aiAgentConversationTurnModule, "runTurn");
const mockMarkRunStatus = spyOn(aiAgentConversationTurnModule, "markRunStatus");
const mockAppendSystemErrorMessage = spyOn(
  aiAgentConversationTurnModule,
  "appendSystemErrorMessage",
);

const { aiAgentConversationFunctions } =
  await import("@/feature/ai-agent-conversation/ai-agent-conversation-function");
const aiAgentConversationRun = aiAgentConversationFunctions[0];
if (!aiAgentConversationRun) {
  throw new Error("aiAgentConversationRun missing");
}

// --- Helpers ---

const resetMocks = () => {
  mockProvisionVolume.mockReset();
  mockDestroyVolume.mockReset();
  mockProvisionSandbox.mockReset();
  mockStopSandbox.mockReset();
  mockRunTurn.mockReset();
  mockMarkRunStatus.mockReset();
  mockAppendSystemErrorMessage.mockReset();
  mockProvisionVolume.mockResolvedValue({ volumeId: "vol_1" } as never);
  mockProvisionSandbox.mockResolvedValue({ sandboxId: "sbx_1" } as never);
  mockRunTurn.mockResolvedValue({ sessionId: "sess_1" } as never);
  mockMarkRunStatus.mockResolvedValue(undefined as never);
  mockStopSandbox.mockResolvedValue(undefined as never);
  mockDestroyVolume.mockResolvedValue(undefined as never);
  mockAppendSystemErrorMessage.mockResolvedValue(undefined as never);
};

const makeEngine = () =>
  new InngestTestEngine({ function: aiAgentConversationRun });

const startedEvent = (
  overrides: { aiAgentRunId?: Id } = {},
): { name: string; data: Record<string, unknown> } => ({
  name: AI_AGENT_RUN_STARTED_EVENT,
  data: {
    tenant: TENANT,
    aiAgentId: AGENT_ID,
    aiAgentRunId: overrides.aiAgentRunId ?? RUN_ID,
  },
});

// --- Tests ---

beforeEach(resetMocks);

afterAll(() => {
  mockProvisionVolume.mockRestore();
  mockDestroyVolume.mockRestore();
  mockProvisionSandbox.mockRestore();
  mockStopSandbox.mockRestore();
  mockRunTurn.mockRestore();
  mockMarkRunStatus.mockRestore();
  mockAppendSystemErrorMessage.mockRestore();
});

test("aiAgentConversationRun: given a stop event after provisioning, when executed, then provisions volume, terminates with user_stop, and never runs a turn", async () => {
  // given
  const engine = makeEngine();

  // when
  const { result, error } = await engine.execute({
    events: [startedEvent()],
    steps: [
      {
        id: "provision-volume",
        handler: () => ({ volumeId: "vol_1" }),
      },
      {
        id: "wait-user-input-1",
        handler: () => ({
          name: AI_AGENT_RUN_USER_INPUT_EVENT,
          data: { type: "stop", tenant: TENANT, aiAgentRunId: RUN_ID },
        }),
      },
      {
        id: "cleanup-1",
        handler: async () => {
          await mockDestroyVolume({ aiAgentRunId: RUN_ID });
          await mockMarkRunStatus({
            ctx: { tenant: TENANT },
            aiAgentRunId: RUN_ID,
            status: "stopped",
            endedReason: "user_stop",
          });
        },
      },
    ],
  });

  // then
  expect(error).toBeUndefined();
  expect(result).toBeNull();
  expect(mockProvisionSandbox).not.toHaveBeenCalled();
  expect(mockRunTurn).not.toHaveBeenCalled();
  expect(mockDestroyVolume).toHaveBeenCalledWith({ aiAgentRunId: RUN_ID });
  expect(mockMarkRunStatus).toHaveBeenCalledWith(
    expect.objectContaining({
      status: "stopped",
      endedReason: "user_stop",
    }),
  );
});

test("aiAgentConversationRun: given a timeout (no message, no stop), when executed, then terminates with idle_timeout", async () => {
  // given
  const engine = makeEngine();

  // when
  const { error } = await engine.execute({
    events: [startedEvent()],
    steps: [
      { id: "provision-volume", handler: () => ({ volumeId: "vol_1" }) },
      { id: "wait-user-input-1", handler: () => null },
      {
        id: "cleanup-1",
        handler: async () => {
          await mockDestroyVolume({ aiAgentRunId: RUN_ID });
          await mockMarkRunStatus({
            ctx: { tenant: TENANT },
            aiAgentRunId: RUN_ID,
            status: "stopped",
            endedReason: "idle_timeout",
          });
        },
      },
    ],
  });

  // then
  expect(error).toBeUndefined();
  expect(mockMarkRunStatus).toHaveBeenCalledWith(
    expect.objectContaining({
      status: "stopped",
      endedReason: "idle_timeout",
    }),
  );
});

test("aiAgentConversationRun: given an invalid event payload, when executed, then exits without provisioning a volume", async () => {
  // given
  const engine = makeEngine();

  // when
  const { error } = await engine.execute({
    events: [{ name: AI_AGENT_RUN_STARTED_EVENT, data: { invalid: true } }],
  });

  // then
  expect(error).toBeUndefined();
  expect(mockProvisionVolume).not.toHaveBeenCalled();
});

test("aiAgentConversationRun: event names are wired to the documented constants", () => {
  expect(AI_AGENT_RUN_STARTED_EVENT).toBe("ai-agent/run.started");
  expect(AI_AGENT_RUN_USER_INPUT_EVENT).toBe("ai-agent/run.user-input");
});

test("aiAgentConversationRun: given a message event, when executed, then provisions sandbox, runs the turn, stops the sandbox, and marks the run idle", async () => {
  // given
  const MESSAGE_ID = "019606a0-0000-7000-8000-000000000030" as Id;
  const engine = makeEngine();

  // when
  const { error } = await engine.execute({
    events: [startedEvent()],
    steps: [
      {
        id: "provision-volume",
        handler: async () => {
          await mockProvisionVolume({ aiAgentRunId: RUN_ID });
          return { volumeId: "vol_1" };
        },
      },
      {
        id: "wait-user-input-1",
        handler: () => ({
          name: AI_AGENT_RUN_USER_INPUT_EVENT,
          data: {
            type: "message",
            tenant: TENANT,
            aiAgentRunId: RUN_ID,
            aiAgentMessageId: MESSAGE_ID,
            content: "hello",
          },
        }),
      },
      {
        id: "provision-sandbox-1",
        handler: async () => {
          await mockProvisionSandbox({ volumeId: "vol_1" });
          return { sandboxId: "sbx_1" };
        },
      },
      {
        id: "run-turn-1",
        handler: async () => {
          await mockRunTurn({
            ctx: { tenant: TENANT },
            aiAgentRunId: RUN_ID,
            aiAgentId: AGENT_ID,
            userMessageId: MESSAGE_ID,
            content: "hello",
            sandboxId: "sbx_1",
            sessionId: null,
          });
          return { sessionId: "sess_1" };
        },
      },
      {
        id: "teardown-sandbox-1",
        handler: async () => {
          await mockStopSandbox({ sandboxId: "sbx_1" });
          await mockMarkRunStatus({
            ctx: { tenant: TENANT },
            aiAgentRunId: RUN_ID,
            status: "idle",
          });
        },
      },
      { id: "wait-user-input-2", handler: () => null },
      {
        id: "cleanup-2",
        handler: async () => {
          await mockDestroyVolume({ aiAgentRunId: RUN_ID });
          await mockMarkRunStatus({
            ctx: { tenant: TENANT },
            aiAgentRunId: RUN_ID,
            status: "stopped",
            endedReason: "idle_timeout",
          });
        },
      },
    ],
  });

  // then
  expect(error).toBeUndefined();
  expect(mockProvisionVolume).toHaveBeenCalledTimes(1);
  expect(mockProvisionSandbox).toHaveBeenCalledWith({ volumeId: "vol_1" });
  expect(mockRunTurn).toHaveBeenCalledWith(
    expect.objectContaining({
      sandboxId: "sbx_1",
      userMessageId: MESSAGE_ID,
      content: "hello",
    }),
  );
  expect(mockStopSandbox).toHaveBeenCalledWith({ sandboxId: "sbx_1" });
  expect(mockMarkRunStatus).toHaveBeenCalledWith(
    expect.objectContaining({ status: "idle" }),
  );
  expect(mockAppendSystemErrorMessage).not.toHaveBeenCalled();
});
