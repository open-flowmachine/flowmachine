import { beforeEach, expect, mock, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { AiAgent } from "@/module/ai-agent/ai-agent-model";
import type { Tenant } from "@/shared/model/model-tenant";

import { Err } from "@/shared/err/err";
import { type Id, idSchema } from "@/shared/model/model-id";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const NEW_ID = "019606a0-0000-7000-8000-000000000002" as Id;

const tenant: Tenant = { id: TEST_ID, type: "organization" };
const ctx = { tenant };

const mockRepository = {
  findMany: mock(),
  findById: mock(),
  insert: mock(),
  update: mock(),
  deleteById: mock(),
};

mock.module("@/module/ai-agent/ai-agent-repository", () => ({
  aiAgentRepository: mockRepository,
}));

mock.module("@/shared/model/model-id", () => ({
  idSchema,
  newId: () => NEW_ID,
}));

const { makeAiAgentService } = await import("./ai-agent-service");
const aiAgentService = makeAiAgentService();

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
  mockRepository.findMany.mockClear();
  mockRepository.findById.mockClear();
  mockRepository.insert.mockClear();
  mockRepository.update.mockClear();
  mockRepository.deleteById.mockClear();
};

// --- Tests ---

beforeEach(resetMocks);

test("create: given a valid payload, when inserted, then returns the new id", async () => {
  // given
  mockRepository.insert.mockResolvedValue(ok());

  // when
  const result = await aiAgentService.create({
    ctx,
    payload: {
      name: "New Agent",
      model: "claude-sonnet-4-6",
      projects: [],
    },
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ id: NEW_ID });
  expect(mockRepository.insert).toHaveBeenCalledWith({
    ctx,
    data: expect.objectContaining({
      id: NEW_ID,
      _version: 1,
      name: "New Agent",
      model: "claude-sonnet-4-6",
      projects: [],
    }),
  });
});

test("create: given a valid payload, when repository insert fails, then returns err", async () => {
  // given
  mockRepository.insert.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await aiAgentService.create({
    ctx,
    payload: {
      name: "New Agent",
      model: "claude-sonnet-4-6",
      projects: [],
    },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("get: given an existing ai agent id, when fetched, then returns the ai agent", async () => {
  // given
  const aiAgent = makeAiAgent();
  mockRepository.findById.mockResolvedValue(ok({ data: aiAgent }));

  // when
  const result = await aiAgentService.get({ ctx, id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: aiAgent } as never);
  expect(mockRepository.findById).toHaveBeenCalledWith({ ctx, id: TEST_ID });
});

test("get: given a non-existent ai agent id, when fetched, then returns notFound err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(ok({ data: null }));

  // when
  const result = await aiAgentService.get({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
});

test("get: given a valid id, when repository fails, then returns err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await aiAgentService.get({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("list: given existing ai agents, when listed, then returns all ai agents for the tenant", async () => {
  // given
  const aiAgents = [makeAiAgent(), makeAiAgent({ name: "Second" })];
  mockRepository.findMany.mockResolvedValue(ok({ data: aiAgents }));

  // when
  const result = await aiAgentService.list({ ctx });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: aiAgents } as never);
  expect(mockRepository.findMany).toHaveBeenCalledWith({ ctx });
});

test("list: given a tenant, when repository fails, then returns err", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await aiAgentService.list({ ctx });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("list: given a projectId filter, when listed, then passes projects.id filter to repository", async () => {
  // given
  const PROJECT_ID = "019606a0-0000-7000-8000-000000000099" as Id;
  const aiAgents = [makeAiAgent()];
  mockRepository.findMany.mockResolvedValue(ok({ data: aiAgents }));

  // when
  const result = await aiAgentService.list({
    ctx,
    filter: { projectId: PROJECT_ID },
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockRepository.findMany).toHaveBeenCalledWith({
    ctx,
    filter: { "projects.id": PROJECT_ID },
  });
});

test("list: given no filter, when listed, then passes undefined filter to repository", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(ok({ data: [] }));

  // when
  const result = await aiAgentService.list({ ctx });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockRepository.findMany).toHaveBeenCalledWith({
    ctx,
    filter: undefined,
  });
});

test("update: given an existing ai agent, when updated, then returns the updated data", async () => {
  // given
  const existing = makeAiAgent();
  const updated = makeAiAgent({ name: "Updated", _version: 2 });
  mockRepository.findById.mockResolvedValue(ok({ data: existing }));
  mockRepository.update.mockResolvedValue(ok({ data: updated }));

  // when
  const result = await aiAgentService.update({
    ctx,
    id: TEST_ID,
    data: { name: "Updated", _version: 1 },
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: updated } as never);
  expect(mockRepository.update).toHaveBeenCalledWith({
    ctx,
    id: TEST_ID,
    data: expect.objectContaining({ name: "Updated", _version: 1 }),
  });
});

test("update: given a non-existent ai agent id, when updated, then returns notFound err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(ok({ data: null }));

  // when
  const result = await aiAgentService.update({
    ctx,
    id: TEST_ID,
    data: { name: "Updated", _version: 1 },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
});

test("update: given an existing ai agent, when repository update fails, then returns err", async () => {
  // given
  const existing = makeAiAgent();
  mockRepository.findById.mockResolvedValue(ok({ data: existing }));
  mockRepository.update.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await aiAgentService.update({
    ctx,
    id: TEST_ID,
    data: { name: "Updated", _version: 1 },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("delete: given an existing ai agent id, when deleted, then succeeds", async () => {
  // given
  mockRepository.deleteById.mockResolvedValue(ok());

  // when
  const result = await aiAgentService.delete({ ctx, id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockRepository.deleteById).toHaveBeenCalledWith({
    ctx,
    id: TEST_ID,
  });
});

test("delete: given a valid id, when repository delete fails, then returns err", async () => {
  // given
  mockRepository.deleteById.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await aiAgentService.delete({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});
