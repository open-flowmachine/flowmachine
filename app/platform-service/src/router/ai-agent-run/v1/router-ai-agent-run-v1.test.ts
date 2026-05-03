import { afterAll, beforeEach, expect, mock, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

import * as aiAgentRunServiceModule from "@/module/ai-agent-run/ai-agent-run-service";
import { Err } from "@/shared/err/err";
import { betterAuthClient } from "@/vendor/better-auth/better-auth-client";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const TENANT: Tenant = { id: TEST_ID, type: "organization" };

const mockGetAiAgentRun = mock();
const mockListAiAgentRuns = mock();

const mockAiAgentRunService = {
  get: mockGetAiAgentRun,
  list: mockListAiAgentRuns,
};

const makeAiAgentRunServiceSpy = spyOn(
  aiAgentRunServiceModule,
  "makeAiAgentRunService",
).mockReturnValue(
  mockAiAgentRunService as unknown as ReturnType<
    typeof aiAgentRunServiceModule.makeAiAgentRunService
  >,
);

const getSessionSpy = spyOn(
  betterAuthClient.api,
  "getSession",
).mockResolvedValue({
  session: { userId: TEST_ID, activeOrganizationId: TENANT.id },
  user: { id: TEST_ID },
} as never);

const { aiAgentRunV1Router } =
  await import("@/router/ai-agent-run/v1/router-ai-agent-run-v1");

// --- Helpers ---

const now = new Date("2026-01-01");

const makeAiAgentRun = (overrides?: Partial<AiAgentRun>): AiAgentRun =>
  ({
    id: TEST_ID,
    _version: 1,
    createdAt: now,
    updatedAt: now,
    aiAgentId: TEST_ID,
    sandbox: null,
    sessionId: null,
    status: "idle",
    ...overrides,
  }) as AiAgentRun;

const resetMocks = () => {
  mockGetAiAgentRun.mockReset();
  mockListAiAgentRuns.mockReset();

  getSessionSpy.mockReset();
  getSessionSpy.mockResolvedValue({
    session: { userId: TEST_ID, activeOrganizationId: TENANT.id },
    user: { id: TEST_ID },
  } as never);
};

const app = aiAgentRunV1Router;

const request = (method: string, path: string) => {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
    }),
  );
};

// --- Tests ---

beforeEach(resetMocks);

afterAll(() => {
  makeAiAgentRunServiceSpy.mockRestore();
  getSessionSpy.mockRestore();
});

test("GET /api/v1/ai-agent/:aiAgentId/run: given runs exist, when listed, then returns runs mapped to DTOs", async () => {
  // given
  const aiAgentRuns = [
    makeAiAgentRun(),
    makeAiAgentRun({
      status: "initialized",
      id: "019606a0-0000-7000-8000-000000000002" as Id,
    }),
  ];
  mockListAiAgentRuns.mockResolvedValue(ok({ data: aiAgentRuns }));

  // when
  const response = await request("GET", `/api/v1/ai-agent/${TEST_ID}/run`);
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.data).toHaveLength(2);
  expect(json.data[0].status).toBe("idle");
  expect(json.data[1].status).toBe("initialized");
  expect(mockListAiAgentRuns).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    filter: { aiAgentId: TEST_ID },
  });
});

test("GET /api/v1/ai-agent/:aiAgentId/run: given a service failure, when listed, then returns errEnvelope", async () => {
  // given
  mockListAiAgentRuns.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request("GET", `/api/v1/ai-agent/${TEST_ID}/run`);
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});

test("GET /api/v1/ai-agent/:aiAgentId/run/:aiAgentRunId: given a run exists, when fetched by id, then returns the run mapped to DTO", async () => {
  // given
  const aiAgentRun = makeAiAgentRun();
  mockGetAiAgentRun.mockResolvedValue(ok({ data: aiAgentRun }));

  // when
  const response = await request(
    "GET",
    `/api/v1/ai-agent/${TEST_ID}/run/${TEST_ID}`,
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.data.status).toBe("idle");
  expect(json.data.id).toBe(TEST_ID);
  expect(mockGetAiAgentRun).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: TEST_ID,
  });
});

test("GET /api/v1/ai-agent/:aiAgentId/run/:aiAgentRunId: given the run does not exist, when fetched by id, then returns notFound errEnvelope", async () => {
  // given
  mockGetAiAgentRun.mockResolvedValue(err(Err.code("notFound")));

  // when
  const response = await request(
    "GET",
    `/api/v1/ai-agent/${TEST_ID}/run/${TEST_ID}`,
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(404);
  expect(json.code).toBe("notFound");
});
