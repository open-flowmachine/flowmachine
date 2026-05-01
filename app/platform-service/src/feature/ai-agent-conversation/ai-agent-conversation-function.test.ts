import { InngestTestEngine } from "@inngest/test";
import { afterAll, beforeEach, expect, mock, spyOn, test } from "bun:test";
import { ok } from "neverthrow";

import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

import {
  AI_AGENT_RUN_STARTED_EVENT,
  AI_AGENT_RUN_TERMINATED_EVENT,
  AI_AGENT_RUN_USER_INPUT_EVENT,
} from "@/feature/ai-agent-conversation/ai-agent-conversation-constant";
import * as aiAgentConversationTurnModule from "@/feature/ai-agent-conversation/ai-agent-conversation-turn";
import { aiAgentRunMessageRepository } from "@/module/ai-agent-run-message/ai-agent-run-message-repository";
import * as modelIdModule from "@/shared/model/model-id";

// --- Mock setup ---

const TENANT_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const AGENT_ID = "019606a0-0000-7000-8000-000000000010" as Id;
const RUN_ID = "019606a0-0000-7000-8000-000000000020" as Id;
const SEEDED_MESSAGE_ID = "019606a0-0000-7000-8000-000000000040" as Id;
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
const mockMessageRepoInsert = spyOn(aiAgentRunMessageRepository, "insert");
const newIdSpy = spyOn(modelIdModule, "newId");

const { aiAgentConversationFunctions } = await import(
  "@/feature/ai-agent-conversation/ai-agent-conversation-function"
);
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
  mockMessageRepoInsert.mockReset();
  newIdSpy.mockReset();
  mockProvisionVolume.mockResolvedValue({ volumeId: "vol_1" } as never);
  mockProvisionSandbox.mockResolvedValue({ sandboxId: "sbx_1" } as never);
  mockRunTurn.mockResolvedValue({ sessionId: "sess_1" } as never);
  mockMarkRunStatus.mockResolvedValue(undefined as never);
  mockStopSandbox.mockResolvedValue(undefined as never);
  mockDestroyVolume.mockResolvedValue(undefined as never);
  mockAppendSystemErrorMessage.mockResolvedValue(undefined as never);
  mockMessageRepoInsert.mockResolvedValue(ok() as never);
  newIdSpy.mockReturnValue(SEEDED_MESSAGE_ID);
};

const makeEngine = () =>
  new InngestTestEngine({ function: aiAgentConversationRun });

const startedEvent = (
  overrides: { aiAgentRunId?: Id; initialMessage?: string } = {},
): { name: string; data: Record<string, unknown> } => ({
  name: AI_AGENT_RUN_STARTED_EVENT,
  data: {
    tenant: TENANT,
    aiAgentId: AGENT_ID,
    aiAgentRunId: overrides.aiAgentRunId ?? RUN_ID,
    ...(overrides.initialMessage ? { initialMessage: overrides.initialMessage } : {}),
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
  mockMessageRepoInsert.mockRestore();
  newIdSpy.mockRestore();
});

test("aiAgentConversationRun: given a stop event after provisioning, when executed, then provisions volume, terminates with user_stop, emits run.terminated, and never runs a turn", async () => {
  // given
  const engine = makeEngine();
  const emitTerminatedHandler = mock(() => null);

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
      { id: "emit-terminated-1", handler: emitTerminatedHandler },
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
  expect(emitTerminatedHandler).toHaveBeenCalledTimes(1);
});

test("aiAgentConversationRun: given a timeout (no message, no stop), when executed, then terminates with idle_timeout and emits run.terminated", async () => {
  // given
  const engine = makeEngine();
  const emitTerminatedHandler = mock(() => null);

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
      { id: "emit-terminated-1", handler: emitTerminatedHandler },
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
  expect(emitTerminatedHandler).toHaveBeenCalledTimes(1);
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
  expect(AI_AGENT_RUN_TERMINATED_EVENT).toBe("ai-agent/run.terminated");
});

test("aiAgentConversationRun: given a message event, when executed, then provisions sandbox, runs the turn, stops the sandbox, and marks the run idle", async () => {
  // given
  const MESSAGE_ID = "019606a0-0000-7000-8000-000000000030" as Id;
  const engine = makeEngine();
  const emitTerminatedHandler = mock(() => null);

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
        id: "claude-turn-1",
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
      { id: "emit-terminated-2", handler: emitTerminatedHandler },
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
  expect(emitTerminatedHandler).toHaveBeenCalledTimes(1);
});

test("aiAgentConversationRun: given event data with initialMessage, when executed, then seeds a user message and proceeds to the first turn without waiting for external user input", async () => {
  // given
  const engine = makeEngine();
  const seedHandler = mock(() => ({
    aiAgentMessageId: SEEDED_MESSAGE_ID,
    content: "kick things off",
  }));
  const provisionSandboxHandler = mock(async () => {
    await mockProvisionSandbox({ volumeId: "vol_1" });
    return { sandboxId: "sbx_1" };
  });
  const claudeTurnHandler = mock(async () => {
    await mockRunTurn({
      ctx: { tenant: TENANT },
      aiAgentRunId: RUN_ID,
      aiAgentId: AGENT_ID,
      userMessageId: SEEDED_MESSAGE_ID,
      content: "kick things off",
      sandboxId: "sbx_1",
      sessionId: null,
    });
    return { sessionId: "sess_1" };
  });
  const waitUserInput1 = mock(() => null);

  // when
  const { error } = await engine.execute({
    events: [startedEvent({ initialMessage: "kick things off" })],
    steps: [
      { id: "provision-volume", handler: () => ({ volumeId: "vol_1" }) },
      { id: "seed-initial-message", handler: seedHandler },
      { id: "provision-sandbox-1", handler: provisionSandboxHandler },
      { id: "claude-turn-1", handler: claudeTurnHandler },
      {
        id: "teardown-sandbox-1",
        handler: async () => {
          await mockStopSandbox({ sandboxId: "sbx_1" });
        },
      },
      { id: "wait-user-input-2", handler: waitUserInput1 },
      {
        id: "cleanup-2",
        handler: async () => {
          await mockDestroyVolume({ aiAgentRunId: RUN_ID });
        },
      },
      { id: "emit-terminated-2", handler: () => null },
    ],
  });

  // then
  expect(error).toBeUndefined();
  expect(seedHandler).toHaveBeenCalledTimes(1);
  expect(provisionSandboxHandler).toHaveBeenCalledTimes(1);
  expect(claudeTurnHandler).toHaveBeenCalledTimes(1);
  expect(mockRunTurn).toHaveBeenCalledWith(
    expect.objectContaining({
      userMessageId: SEEDED_MESSAGE_ID,
      content: "kick things off",
    }),
  );
});
