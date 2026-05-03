import { afterAll, beforeEach, expect, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-model";
import type { Tenant } from "@/shared/model/model-tenant";

import { aiAgentRunRepository } from "@/module/ai-agent-run/ai-agent-run-repository";
import { makeAiAgentRunService } from "@/module/ai-agent-run/ai-agent-run-service";
import { Err } from "@/shared/err/err";
import * as modelIdModule from "@/shared/model/model-id";
import { type Id } from "@/shared/model/model-id";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const RUN_ID = "019606a0-0000-7000-8000-000000000010" as Id;
const AGENT_ID = "019606a0-0000-7000-8000-000000000020" as Id;
const NEW_ID = "019606a0-0000-7000-8000-000000000099" as Id;

const tenant: Tenant = { id: TEST_ID, type: "organization" };
const ctx = { tenant };

const mockRepository = {
  findMany: spyOn(aiAgentRunRepository, "findMany"),
  findById: spyOn(aiAgentRunRepository, "findById"),
  insert: spyOn(aiAgentRunRepository, "insert"),
  update: spyOn(aiAgentRunRepository, "update"),
  deleteById: spyOn(aiAgentRunRepository, "deleteById"),
};

const newIdSpy = spyOn(modelIdModule, "newId");

const aiAgentRunService = makeAiAgentRunService();

// --- Helpers ---

const now = new Date("2026-01-01");

const makeRun = (overrides?: Partial<AiAgentRun>): AiAgentRun => ({
  id: RUN_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  aiAgentId: AGENT_ID,
  status: "idle",
  sessionId: null,
  sandbox: null,
  ...overrides,
});

const resetMocks = () => {
  mockRepository.findMany.mockReset();
  mockRepository.findById.mockReset();
  mockRepository.insert.mockReset();
  mockRepository.update.mockReset();
  mockRepository.deleteById.mockReset();
  newIdSpy.mockReset();
  newIdSpy.mockReturnValue(NEW_ID);
};

// --- Tests ---

beforeEach(resetMocks);

afterAll(() => {
  mockRepository.findMany.mockRestore();
  mockRepository.findById.mockRestore();
  mockRepository.insert.mockRestore();
  mockRepository.update.mockRestore();
  mockRepository.deleteById.mockRestore();
  newIdSpy.mockRestore();
});

test("create: given no existing runs, when called, then inserts a provisioning run and returns id", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(ok({ data: [] }));
  mockRepository.insert.mockResolvedValue(ok());

  // when
  const result = await aiAgentRunService.create({
    ctx,
    payload: {
      aiAgentId: AGENT_ID,
      sandbox: null,
      sessionId: null,
      status: "initializing",
    },
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ id: NEW_ID });
  expect(mockRepository.insert).toHaveBeenCalledWith({
    ctx,
    data: expect.objectContaining({
      id: NEW_ID,
      aiAgentId: AGENT_ID,
      status: "initializing",
      sessionId: null,
      sandbox: null,
    }),
  });
});

test("create: given a non-terminal run already exists, when called, then still inserts a new run", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(
    ok({ data: [makeRun({ status: "initializing" })] }),
  );
  mockRepository.insert.mockResolvedValue(ok());

  // when
  const result = await aiAgentRunService.create({
    ctx,
    payload: {
      aiAgentId: AGENT_ID,
      sandbox: null,
      sessionId: null,
      status: "initializing",
    },
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockRepository.insert).toHaveBeenCalledTimes(1);
});

test("create: given only terminal runs exist, when called, then inserts a new run", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(
    ok({
      data: [makeRun({ status: "stopped" }), makeRun({ status: "failed" })],
    }),
  );
  mockRepository.insert.mockResolvedValue(ok());

  // when
  const result = await aiAgentRunService.create({
    ctx,
    payload: {
      aiAgentId: AGENT_ID,
      sandbox: null,
      sessionId: null,
      status: "initializing",
    },
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockRepository.insert).toHaveBeenCalledTimes(1);
});

test("get: given an existing run, when called, then returns it", async () => {
  // given
  const run = makeRun();
  mockRepository.findById.mockResolvedValue(ok({ data: run }));

  // when
  const result = await aiAgentRunService.get({ ctx, id: RUN_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: run } as never);
});

test("get: given a non-existent run, when called, then returns notFound err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(ok({ data: null }));

  // when
  const result = await aiAgentRunService.get({ ctx, id: RUN_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
});

test("list: given an aiAgentId filter, when called, then forwards the filter", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(ok({ data: [] }));

  // when
  await aiAgentRunService.list({ ctx, filter: { aiAgentId: AGENT_ID } });

  // then
  expect(mockRepository.findMany).toHaveBeenCalledWith({
    ctx,
    filter: { aiAgentId: AGENT_ID },
  });
});

test("update: given a non-existent run, when called, then returns notFound err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(ok({ data: null }));

  // when
  const result = await aiAgentRunService.update({
    ctx,
    id: RUN_ID,
    data: { status: "idle" },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
});

test("update: given the repository fails, when called, then returns the err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await aiAgentRunService.update({
    ctx,
    id: RUN_ID,
    data: { status: "idle" },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});
