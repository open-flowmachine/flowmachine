import { afterAll, beforeEach, expect, mock, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { AiAgentRunMessage } from "@/module/ai-agent-run-message/ai-agent-run-message-model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/tenant/tenant-model";

import * as aiAgentRunMessageServiceModule from "@/module/ai-agent-run-message/ai-agent-run-message-service";
import { Err } from "@/shared/err/err";
import { betterAuthClient } from "@/vendor/better-auth/better-auth-client";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const RUN_ID = "019606a0-0000-7000-8000-000000000010" as Id;
const TENANT: Tenant = { id: TEST_ID, type: "organization" };

const mockCreateAiAgentRunMessage = mock();
const mockListAiAgentRunMessages = mock();

const mockAiAgentRunMessageService = {
  create: mockCreateAiAgentRunMessage,
  list: mockListAiAgentRunMessages,
};

const makeAiAgentRunMessageServiceSpy = spyOn(
  aiAgentRunMessageServiceModule,
  "makeAiAgentRunMessageService",
).mockReturnValue(
  mockAiAgentRunMessageService as unknown as ReturnType<
    typeof aiAgentRunMessageServiceModule.makeAiAgentRunMessageService
  >,
);

const getSessionSpy = spyOn(
  betterAuthClient.api,
  "getSession",
).mockResolvedValue({
  session: { userId: TEST_ID, activeOrganizationId: TENANT.id },
  user: { id: TEST_ID },
} as never);

const { aiAgentRunMessageV1Router } =
  await import("@/router/ai-agent-run-message/v1/router-ai-agent-run-message-v1");

// --- Helpers ---

const now = new Date("2026-01-01");

const makeAiAgentRunMessage = (
  overrides?: Partial<AiAgentRunMessage>,
): AiAgentRunMessage =>
  ({
    id: TEST_ID,
    _version: 1,
    createdAt: now,
    updatedAt: now,
    aiAgentRunId: RUN_ID,
    role: "user",
    content: "Hello",
    toolName: null,
    toolInput: null,
    toolResult: null,
    ...overrides,
  }) as AiAgentRunMessage;

const resetMocks = () => {
  mockCreateAiAgentRunMessage.mockReset();
  mockListAiAgentRunMessages.mockReset();

  getSessionSpy.mockReset();
  getSessionSpy.mockResolvedValue({
    session: { userId: TEST_ID, activeOrganizationId: TENANT.id },
    user: { id: TEST_ID },
  } as never);
};

const app = aiAgentRunMessageV1Router;

const request = (method: string, path: string, body?: unknown) => {
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return app.handle(new Request(`http://localhost${path}`, init));
};

// --- Tests ---

beforeEach(resetMocks);

afterAll(() => {
  makeAiAgentRunMessageServiceSpy.mockRestore();
  getSessionSpy.mockRestore();
});

test("POST /api/v1/ai-agent/:aiAgentId/run/:aiAgentRunId/message: given a valid payload, when created successfully, then returns okEnvelope with full DTO", async () => {
  // given
  const message = makeAiAgentRunMessage({ role: "assistant", content: "Hi" });
  mockCreateAiAgentRunMessage.mockResolvedValue(ok({ data: message }));

  // when
  const response = await request(
    "POST",
    `/api/v1/ai-agent/${TEST_ID}/run/${RUN_ID}/message`,
    {
      role: "assistant",
      content: "Hi",
    },
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(json.data.id).toBe(TEST_ID);
  expect(json.data.role).toBe("assistant");
  expect(json.data.content).toBe("Hi");
  expect(mockCreateAiAgentRunMessage).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    payload: {
      role: "assistant",
      content: "Hi",
      toolName: null,
      toolInput: null,
      toolResult: null,
      aiAgentRunId: RUN_ID,
    },
  });
});

test("POST /api/v1/ai-agent/:aiAgentId/run/:aiAgentRunId/message: given a service failure, when called, then returns errEnvelope", async () => {
  // given
  mockCreateAiAgentRunMessage.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request(
    "POST",
    `/api/v1/ai-agent/${TEST_ID}/run/${RUN_ID}/message`,
    {
      role: "user",
      content: "test",
    },
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});

test("GET /api/v1/ai-agent/:aiAgentId/run/:aiAgentRunId/message: given messages exist, when listed, then returns messages mapped to DTOs", async () => {
  // given
  const messages = [
    makeAiAgentRunMessage(),
    makeAiAgentRunMessage({
      role: "assistant",
      content: "Hi there",
      id: "019606a0-0000-7000-8000-000000000002" as Id,
    }),
  ];
  mockListAiAgentRunMessages.mockResolvedValue(ok({ data: messages }));

  // when
  const response = await request(
    "GET",
    `/api/v1/ai-agent/${TEST_ID}/run/${RUN_ID}/message`,
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.data).toHaveLength(2);
  expect(json.data[0].role).toBe("user");
  expect(json.data[1].role).toBe("assistant");
  expect(mockListAiAgentRunMessages).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    filter: { aiAgentRunId: RUN_ID },
  });
});

test("GET /api/v1/ai-agent/:aiAgentId/run/:aiAgentRunId/message: given a service failure, when listed, then returns errEnvelope", async () => {
  // given
  mockListAiAgentRunMessages.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request(
    "GET",
    `/api/v1/ai-agent/${TEST_ID}/run/${RUN_ID}/message`,
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});
