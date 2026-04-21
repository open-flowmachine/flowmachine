import { beforeEach, expect, mock, test } from "bun:test";
import Elysia from "elysia";
import { err, ok } from "neverthrow";

import type { AiAgent } from "@/module/ai-agent/ai-agent-model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

import { Err } from "@/shared/err/err";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const TENANT: Tenant = { id: TEST_ID, type: "organization" };

const mockCreateAiAgent = mock();
const mockGetAiAgent = mock();
const mockListAiAgents = mock();
const mockUpdateAiAgent = mock();
const mockDeleteAiAgent = mock();

mock.module("@/module/ai-agent/ai-agent-service", () => ({
  makeAiAgentService: () => ({
    create: mockCreateAiAgent,
    get: mockGetAiAgent,
    list: mockListAiAgents,
    update: mockUpdateAiAgent,
    delete: mockDeleteAiAgent,
  }),
}));

mock.module("@/router/router-auth-guard", () => ({
  routerAuthGuard: new Elysia({ name: "httpAuthGuard" }).resolve(
    { as: "scoped" },
    () => ({
      tenant: TENANT,
    }),
  ),
}));

const { aiAgentV1Router } =
  await import("@/router/ai-agent/v1/router-ai-agent-v1");

// --- Helpers ---

const now = new Date("2026-01-01");

const makeAiAgent = (overrides?: Partial<AiAgent>): AiAgent => ({
  id: TEST_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  name: "My Agent",
  model: "anthropic/claude-sonnet-4.6",
  projects: [],
  ...overrides,
});

const resetMocks = () => {
  mockCreateAiAgent.mockClear();
  mockGetAiAgent.mockClear();
  mockListAiAgents.mockClear();
  mockUpdateAiAgent.mockClear();
  mockDeleteAiAgent.mockClear();
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

test("POST /api/v1/ai-agent: given a valid payload, when created successfully, then returns okEnvelope with id", async () => {
  // given
  const newId = "019606a0-0000-7000-8000-000000000099" as Id;
  mockCreateAiAgent.mockResolvedValue(ok({ id: newId }));

  // when
  const response = await request("POST", "/api/v1/ai-agent", {
    name: "New Agent",
    model: "anthropic/claude-sonnet-4.6",
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
      model: "anthropic/claude-sonnet-4.6",
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
    model: "anthropic/claude-sonnet-4.6",
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
