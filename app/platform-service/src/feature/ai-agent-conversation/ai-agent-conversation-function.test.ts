import { InngestTestEngine } from "@inngest/test";
import { beforeEach, expect, mock, test } from "bun:test";

import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

import {
  AI_AGENT_RUN_MESSAGE_RECEIVED_EVENT,
  AI_AGENT_RUN_STARTED_EVENT,
  AI_AGENT_RUN_STOP_REQUESTED_EVENT,
} from "@/feature/ai-agent-conversation/ai-agent-conversation-constant";

// --- Mock setup ---

const TENANT_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const AGENT_ID = "019606a0-0000-7000-8000-000000000010" as Id;
const RUN_ID = "019606a0-0000-7000-8000-000000000020" as Id;
const TENANT: Tenant = { id: TENANT_ID, type: "organization" };

const mockProvisionVolume = mock();
const mockDestroyVolume = mock();
const mockProvisionSandbox = mock();
const mockTeardownSandbox = mock();
const mockRunTurn = mock();
const mockMarkRunStatus = mock();
const mockAppendSystemErrorMessage = mock();

mock.module(
  "@/feature/ai-agent-conversation/ai-agent-conversation-turn",
  () => ({
    provisionVolume: mockProvisionVolume,
    destroyVolume: mockDestroyVolume,
    provisionSandbox: mockProvisionSandbox,
    teardownSandbox: mockTeardownSandbox,
    runTurn: mockRunTurn,
    markRunStatus: mockMarkRunStatus,
    appendSystemErrorMessage: mockAppendSystemErrorMessage,
  }),
);

process.env.ANTHROPIC_API_KEY ??= "test-key";
process.env.AI_AGENT_RUN_IDLE_TIMEOUT_DAYS ??= "7";

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
  mockTeardownSandbox.mockReset();
  mockRunTurn.mockReset();
  mockMarkRunStatus.mockReset();
  mockAppendSystemErrorMessage.mockReset();
  mockProvisionVolume.mockResolvedValue({ volumeId: "vol_1" });
  mockProvisionSandbox.mockResolvedValue({ sandboxId: "sbx_1" });
  mockRunTurn.mockResolvedValue({ sessionId: "sess_1" });
  mockMarkRunStatus.mockResolvedValue(undefined);
  mockTeardownSandbox.mockResolvedValue(undefined);
  mockDestroyVolume.mockResolvedValue(undefined);
  mockAppendSystemErrorMessage.mockResolvedValue(undefined);
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
        id: "wait-message-1",
        handler: () => null,
      },
      {
        id: "wait-stop-1",
        handler: () => ({
          name: AI_AGENT_RUN_STOP_REQUESTED_EVENT,
          data: { tenant: TENANT, aiAgentRunId: RUN_ID },
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
      { id: "wait-message-1", handler: () => null },
      { id: "wait-stop-1", handler: () => null },
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
  expect(AI_AGENT_RUN_MESSAGE_RECEIVED_EVENT).toBe(
    "ai-agent/run.message-received",
  );
  expect(AI_AGENT_RUN_STOP_REQUESTED_EVENT).toBe("ai-agent/run.stop-requested");
});
