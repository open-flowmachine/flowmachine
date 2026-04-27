import { afterAll, beforeEach, expect, mock, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { AiAgent } from "@/module/ai-agent/ai-agent-model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

import * as aiAgentServiceModule from "@/module/ai-agent/ai-agent-service";
import * as aiAgentRunMessageServiceModule from "@/module/ai-agent-run-message/ai-agent-run-message-service";
import * as aiAgentRunServiceModule from "@/module/ai-agent-run/ai-agent-run-service";
import { Err } from "@/shared/err/err";
import { betterAuthClient } from "@/vendor/better-auth/better-auth-client";
import { inngestClient } from "@/vendor/inngest/inngest-client";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const TENANT: Tenant = { id: TEST_ID, type: "organization" };

const mockCreateAiAgent = mock();
const mockGetAiAgent = mock();
const mockListAiAgents = mock();
const mockUpdateAiAgent = mock();
const mockDeleteAiAgent = mock();

const mockCreateAiAgentRun = mock();
const mockGetAiAgentRun = mock();
const mockListAiAgentRuns = mock();
const mockMarkProcessingAiAgentRun = mock();
const mockUpdateAiAgentRun = mock();

const mockAppendAiAgentRunMessage = mock();
const mockListAiAgentRunMessages = mock();

const mockAiAgentService = {
  create: mockCreateAiAgent,
  get: mockGetAiAgent,
  list: mockListAiAgents,
  update: mockUpdateAiAgent,
  delete: mockDeleteAiAgent,
};

const mockAiAgentRunService = {
  create: mockCreateAiAgentRun,
  get: mockGetAiAgentRun,
  list: mockListAiAgentRuns,
  update: mockUpdateAiAgentRun,
  markProcessing: mockMarkProcessingAiAgentRun,
};

const mockAiAgentRunMessageService = {
  append: mockAppendAiAgentRunMessage,
  list: mockListAiAgentRunMessages,
};

const makeAiAgentServiceSpy = spyOn(
  aiAgentServiceModule,
  "makeAiAgentService",
).mockReturnValue(
  mockAiAgentService as unknown as ReturnType<
    typeof aiAgentServiceModule.makeAiAgentService
  >,
);

const makeAiAgentRunServiceSpy = spyOn(
  aiAgentRunServiceModule,
  "makeAiAgentRunService",
).mockReturnValue(
  mockAiAgentRunService as unknown as ReturnType<
    typeof aiAgentRunServiceModule.makeAiAgentRunService
  >,
);

const makeAiAgentRunMessageServiceSpy = spyOn(
  aiAgentRunMessageServiceModule,
  "makeAiAgentRunMessageService",
).mockReturnValue(
  mockAiAgentRunMessageService as unknown as ReturnType<
    typeof aiAgentRunMessageServiceModule.makeAiAgentRunMessageService
  >,
);

const mockInngestSend = spyOn(inngestClient, "send");

const getSessionSpy = spyOn(
  betterAuthClient.api,
  "getSession",
).mockResolvedValue({
  session: { userId: TEST_ID, activeOrganizationId: TENANT.id },
  user: { id: TEST_ID },
} as never);

const { aiAgentV1Router } = await import(
  "@/router/ai-agent/v1/router-ai-agent-v1"
);

// --- Helpers ---

const now = new Date("2026-01-01");

const makeAiAgent = (overrides?: Partial<AiAgent>): AiAgent => ({
  id: TEST_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  name: "My Agent",
  model: "claude-sonnet-4-6",
  projects: [],
  ...overrides,
});

const resetMocks = () => {
  mockCreateAiAgent.mockReset();
  mockGetAiAgent.mockReset();
  mockListAiAgents.mockReset();
  mockUpdateAiAgent.mockReset();
  mockDeleteAiAgent.mockReset();
  mockCreateAiAgentRun.mockReset();
  mockGetAiAgentRun.mockReset();
  mockListAiAgentRuns.mockReset();
  mockMarkProcessingAiAgentRun.mockReset();
  mockUpdateAiAgentRun.mockReset();
  mockAppendAiAgentRunMessage.mockReset();
  mockListAiAgentRunMessages.mockReset();
  mockInngestSend.mockReset();
  mockInngestSend.mockResolvedValue(undefined as never);
  getSessionSpy.mockReset();
  getSessionSpy.mockResolvedValue({
    session: { userId: TEST_ID, activeOrganizationId: TENANT.id },
    user: { id: TEST_ID },
  } as never);
};

const app = aiAgentV1Router;

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
  makeAiAgentServiceSpy.mockRestore();
  makeAiAgentRunServiceSpy.mockRestore();
  makeAiAgentRunMessageServiceSpy.mockRestore();
  mockInngestSend.mockRestore();
  getSessionSpy.mockRestore();
});

test("POST /api/v1/ai-agent: given a valid payload, when created successfully, then returns okEnvelope with id", async () => {
  // given
  const newId = "019606a0-0000-7000-8000-000000000099" as Id;
  mockCreateAiAgent.mockResolvedValue(ok({ id: newId }));

  // when
  const response = await request("POST", "/api/v1/ai-agent", {
    name: "New Agent",
    model: "claude-sonnet-4-6",
    projects: [],
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(json.data).toEqual({ id: newId });
  expect(mockCreateAiAgent).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    payload: {
      name: "New Agent",
      model: "claude-sonnet-4-6",
      projects: [],
    },
  });
});

test("POST /api/v1/ai-agent: given a service failure, when called, then returns errEnvelope", async () => {
  // given
  mockCreateAiAgent.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request("POST", "/api/v1/ai-agent", {
    name: "New Agent",
    model: "claude-sonnet-4-6",
    projects: [],
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});

test("GET /api/v1/ai-agent: given agents exist, when listed, then returns agents mapped to DTOs", async () => {
  // given
  const aiAgents = [
    makeAiAgent(),
    makeAiAgent({
      name: "Second",
      id: "019606a0-0000-7000-8000-000000000002" as Id,
    }),
  ];
  mockListAiAgents.mockResolvedValue(ok({ data: aiAgents }));

  // when
  const response = await request("GET", "/api/v1/ai-agent");
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.data).toHaveLength(2);
  expect(json.data[0].name).toBe("My Agent");
  expect(json.data[1].name).toBe("Second");
  expect(mockListAiAgents).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
  });
});

test("GET /api/v1/ai-agent: given a service failure, when listed, then returns errEnvelope", async () => {
  // given
  mockListAiAgents.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request("GET", "/api/v1/ai-agent");
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});

test("GET /api/v1/ai-agent/:id: given an agent exists, when fetched by id, then returns the agent mapped to DTO", async () => {
  // given
  const aiAgent = makeAiAgent();
  mockGetAiAgent.mockResolvedValue(ok({ data: aiAgent }));

  // when
  const response = await request("GET", `/api/v1/ai-agent/${TEST_ID}`);
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.data.name).toBe("My Agent");
  expect(json.data.id).toBe(TEST_ID);
  expect(mockGetAiAgent).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: TEST_ID,
  });
});

test("GET /api/v1/ai-agent/:id: given the agent does not exist, when fetched by id, then returns notFound errEnvelope", async () => {
  // given
  mockGetAiAgent.mockResolvedValue(err(Err.code("notFound")));

  // when
  const response = await request("GET", `/api/v1/ai-agent/${TEST_ID}`);
  const json = await response.json();

  // then
  expect(json.status).toBe(404);
  expect(json.code).toBe("notFound");
});

test("PATCH /api/v1/ai-agent/:id: given a valid update payload, when updated successfully, then returns okEnvelope", async () => {
  // given
  const updated = makeAiAgent({ name: "Updated", _version: 2 });
  mockUpdateAiAgent.mockResolvedValue(ok({ data: updated }));

  // when
  const response = await request("PATCH", `/api/v1/ai-agent/${TEST_ID}`, {
    name: "Updated",
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(mockUpdateAiAgent).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: TEST_ID,
    data: { name: "Updated" },
  });
});

test("PATCH /api/v1/ai-agent/:id: given a service failure, when updated, then returns errEnvelope", async () => {
  // given
  mockUpdateAiAgent.mockResolvedValue(err(Err.code("notFound")));

  // when
  const response = await request("PATCH", `/api/v1/ai-agent/${TEST_ID}`, {
    name: "Updated",
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(404);
  expect(json.code).toBe("notFound");
});

test("DELETE /api/v1/ai-agent/:id: given the agent exists, when deleted successfully, then returns okEnvelope", async () => {
  // given
  mockDeleteAiAgent.mockResolvedValue(ok());

  // when
  const response = await request("DELETE", `/api/v1/ai-agent/${TEST_ID}`);
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(mockDeleteAiAgent).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: TEST_ID,
  });
});

test("DELETE /api/v1/ai-agent/:id: given a service failure, when deleted, then returns errEnvelope", async () => {
  // given
  mockDeleteAiAgent.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request("DELETE", `/api/v1/ai-agent/${TEST_ID}`);
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});

// --- Run/message/stop/retry tests ---

const RUN_ID = "019606a0-0000-7000-8000-000000000222" as Id;
const MESSAGE_ID = "019606a0-0000-7000-8000-000000000333" as Id;

const makeRun = (status: "idle" | "processing" | "errored" | "stopped" | "provisioning" = "idle") => ({
  id: RUN_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  aiAgentId: TEST_ID,
  status,
  sessionId: null,
  sandbox: null,
  startedAt: now,
  lastMessageAt: null,
  endedAt: null,
  endedReason: null,
});

test("POST /api/v1/ai-agent/:aiAgentId/run: given the agent exists and no active run, when created, then returns 202 with runId and emits started event", async () => {
  // given
  mockGetAiAgent.mockResolvedValue(ok({ data: makeAiAgent() }));
  mockCreateAiAgentRun.mockResolvedValue(ok({ id: RUN_ID }));

  // when
  const response = await request("POST", `/api/v1/ai-agent/${TEST_ID}/run`, {});
  const json = await response.json();

  // then
  expect(json.status).toBe(202);
  expect(json.data).toEqual({ runId: RUN_ID });
  expect(mockInngestSend).toHaveBeenCalledWith(
    expect.objectContaining({
      name: "ai-agent/run.started",
      data: expect.objectContaining({
        aiAgentId: TEST_ID,
        aiAgentRunId: RUN_ID,
      }),
    }),
  );
});

test("POST /api/v1/ai-agent/:aiAgentId/run: given a non-terminal run already exists, when created, then returns 409 conflict and does not emit", async () => {
  // given
  mockGetAiAgent.mockResolvedValue(ok({ data: makeAiAgent() }));
  mockCreateAiAgentRun.mockResolvedValue(
    err(Err.code("conflict", { message: "active run exists" })),
  );

  // when
  const response = await request("POST", `/api/v1/ai-agent/${TEST_ID}/run`, {});
  const json = await response.json();

  // then
  expect(json.status).toBe(409);
  expect(json.code).toBe("conflict");
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/ai-agent/:aiAgentId/run/:runId/message: given an idle run, when message sent, then persists message and emits event", async () => {
  // given
  mockGetAiAgentRun.mockResolvedValue(ok({ data: makeRun("idle") }));
  mockAppendAiAgentRunMessage.mockResolvedValue(
    ok({
      data: {
        id: MESSAGE_ID,
        _version: 1,
        createdAt: now,
        updatedAt: now,
        aiAgentRunId: RUN_ID,
        role: "user",
        content: "hello",
        toolName: null,
        toolInput: null,
        toolResult: null,
      },
    }),
  );
  mockMarkProcessingAiAgentRun.mockResolvedValue(
    ok({ data: makeRun("processing") }),
  );

  // when
  const response = await request(
    "POST",
    `/api/v1/ai-agent/${TEST_ID}/run/${RUN_ID}/message`,
    { content: "hello" },
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(202);
  expect(json.data).toEqual({ messageId: MESSAGE_ID });
  expect(mockInngestSend).toHaveBeenCalledWith(
    expect.objectContaining({
      name: "ai-agent/run.message-received",
      data: expect.objectContaining({
        aiAgentRunId: RUN_ID,
        aiAgentMessageId: MESSAGE_ID,
        content: "hello",
      }),
    }),
  );
});

test("POST /api/v1/ai-agent/:aiAgentId/run/:runId/message: given the run is processing, when message sent, then returns 409 and does not emit", async () => {
  // given
  mockGetAiAgentRun.mockResolvedValue(ok({ data: makeRun("processing") }));
  mockAppendAiAgentRunMessage.mockResolvedValue(
    ok({
      data: {
        id: MESSAGE_ID,
        _version: 1,
        createdAt: now,
        updatedAt: now,
        aiAgentRunId: RUN_ID,
        role: "user",
        content: "hello",
        toolName: null,
        toolInput: null,
        toolResult: null,
      },
    }),
  );
  mockMarkProcessingAiAgentRun.mockResolvedValue(
    err(Err.code("conflict", { message: "already processing" })),
  );

  // when
  const response = await request(
    "POST",
    `/api/v1/ai-agent/${TEST_ID}/run/${RUN_ID}/message`,
    { content: "hello" },
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(409);
  expect(json.code).toBe("conflict");
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/ai-agent/:aiAgentId/run/:runId/message: given the run does not belong to the agent, when message sent, then returns 404", async () => {
  // given
  const OTHER_AGENT_ID = "019606a0-0000-7000-8000-000000000444" as Id;
  mockGetAiAgentRun.mockResolvedValue(
    ok({ data: { ...makeRun("idle"), aiAgentId: OTHER_AGENT_ID } }),
  );

  // when
  const response = await request(
    "POST",
    `/api/v1/ai-agent/${TEST_ID}/run/${RUN_ID}/message`,
    { content: "hello" },
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(404);
  expect(mockAppendAiAgentRunMessage).not.toHaveBeenCalled();
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/ai-agent/:aiAgentId/run/:runId/stop: given a non-terminal run, when stop requested, then returns 202 and emits stop event", async () => {
  // given
  mockGetAiAgentRun.mockResolvedValue(ok({ data: makeRun("idle") }));

  // when
  const response = await request(
    "POST",
    `/api/v1/ai-agent/${TEST_ID}/run/${RUN_ID}/stop`,
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(202);
  expect(mockInngestSend).toHaveBeenCalledWith(
    expect.objectContaining({
      name: "ai-agent/run.stop-requested",
      data: expect.objectContaining({ aiAgentRunId: RUN_ID }),
    }),
  );
});

test("POST /api/v1/ai-agent/:aiAgentId/run/:runId/stop: given a terminal run, when stop requested, then returns 409", async () => {
  // given
  mockGetAiAgentRun.mockResolvedValue(ok({ data: makeRun("stopped") }));

  // when
  const response = await request(
    "POST",
    `/api/v1/ai-agent/${TEST_ID}/run/${RUN_ID}/stop`,
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(409);
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("POST /api/v1/ai-agent/:aiAgentId/run/:runId/retry: given an errored run with prior user message, when retried, then re-emits message-received", async () => {
  // given
  mockGetAiAgentRun.mockResolvedValue(ok({ data: makeRun("errored") }));
  const earlier = new Date("2026-01-02T00:00:00Z");
  const later = new Date("2026-01-03T00:00:00Z");
  mockListAiAgentRunMessages.mockResolvedValue(
    ok({
      data: [
        {
          id: "019606a0-0000-7000-8000-000000000401" as Id,
          _version: 1,
          createdAt: earlier,
          updatedAt: earlier,
          aiAgentRunId: RUN_ID,
          role: "user",
          content: "first",
          toolName: null,
          toolInput: null,
          toolResult: null,
        },
        {
          id: "019606a0-0000-7000-8000-000000000402" as Id,
          _version: 1,
          createdAt: later,
          updatedAt: later,
          aiAgentRunId: RUN_ID,
          role: "user",
          content: "latest",
          toolName: null,
          toolInput: null,
          toolResult: null,
        },
      ],
    }),
  );

  // when
  const response = await request(
    "POST",
    `/api/v1/ai-agent/${TEST_ID}/run/${RUN_ID}/retry`,
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(202);
  expect(mockInngestSend).toHaveBeenCalledWith(
    expect.objectContaining({
      name: "ai-agent/run.message-received",
      data: expect.objectContaining({ content: "latest" }),
    }),
  );
});

test("POST /api/v1/ai-agent/:aiAgentId/run/:runId/retry: given a non-errored run, when retried, then returns 409", async () => {
  // given
  mockGetAiAgentRun.mockResolvedValue(ok({ data: makeRun("idle") }));

  // when
  const response = await request(
    "POST",
    `/api/v1/ai-agent/${TEST_ID}/run/${RUN_ID}/retry`,
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(409);
  expect(mockInngestSend).not.toHaveBeenCalled();
});

test("GET /api/v1/ai-agent/:aiAgentId/run/:runId/message: given an existing run, when fetched, then returns mapped messages", async () => {
  // given
  mockGetAiAgentRun.mockResolvedValue(ok({ data: makeRun("idle") }));
  mockListAiAgentRunMessages.mockResolvedValue(
    ok({
      data: [
        {
          id: MESSAGE_ID,
          _version: 1,
          createdAt: now,
          updatedAt: now,
          aiAgentRunId: RUN_ID,
          role: "user",
          content: "hi",
          toolName: null,
          toolInput: null,
          toolResult: null,
        },
      ],
    }),
  );

  // when
  const response = await request(
    "GET",
    `/api/v1/ai-agent/${TEST_ID}/run/${RUN_ID}/message`,
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.data).toHaveLength(1);
  expect(json.data[0]).toEqual(
    expect.objectContaining({
      id: MESSAGE_ID,
      role: "user",
      content: "hi",
    }),
  );
});
