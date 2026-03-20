import { beforeEach, describe, expect, it, mock } from "bun:test";
import { err, ok } from "neverthrow";
import type { AiAgent } from "@/module/ai-agent/ai-agent-model";
import { Err } from "@/shared/err/err";
import { type Id, idSchema } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

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
  model: "anthropic/claude-sonnet-4.5",
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

describe("createAiAgent", () => {
  beforeEach(resetMocks);

  it("should insert a new ai agent with generated id and timestamps", async () => {
    mockRepository.insert.mockResolvedValue(ok());

    const result = await aiAgentService.create({
      ctx,
      payload: {
        name: "New Agent",
        model: "anthropic/claude-sonnet-4.5",
        projects: [],
      },
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ id: NEW_ID });
    expect(mockRepository.insert).toHaveBeenCalledWith({
      ctx,
      data: expect.objectContaining({
        id: NEW_ID,
        _version: 1,
        name: "New Agent",
        model: "anthropic/claude-sonnet-4.5",
        projects: [],
      }),
    });
  });

  it("should return err when repository insert fails", async () => {
    mockRepository.insert.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await aiAgentService.create({
      ctx,
      payload: {
        name: "New Agent",
        model: "anthropic/claude-sonnet-4.5",
        projects: [],
      },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("getAiAgent", () => {
  beforeEach(resetMocks);

  it("should return the ai agent when found", async () => {
    const aiAgent = makeAiAgent();
    mockRepository.findById.mockResolvedValue(ok({ data: aiAgent }));

    const result = await aiAgentService.get({ ctx, id: TEST_ID });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: aiAgent } as never);
    expect(mockRepository.findById).toHaveBeenCalledWith({ ctx, id: TEST_ID });
  });

  it("should return notFound err when ai agent does not exist", async () => {
    mockRepository.findById.mockResolvedValue(ok({ data: null }));

    const result = await aiAgentService.get({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
    expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
  });

  it("should return err when repository fails", async () => {
    mockRepository.findById.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await aiAgentService.get({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("listAiAgents", () => {
  beforeEach(resetMocks);

  it("should return all ai agents for the tenant", async () => {
    const aiAgents = [makeAiAgent(), makeAiAgent({ name: "Second" })];
    mockRepository.findMany.mockResolvedValue(ok({ data: aiAgents }));

    const result = await aiAgentService.list({ ctx });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: aiAgents } as never);
    expect(mockRepository.findMany).toHaveBeenCalledWith({ ctx });
  });

  it("should return err when repository fails", async () => {
    mockRepository.findMany.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await aiAgentService.list({ ctx });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("updateAiAgent", () => {
  beforeEach(resetMocks);

  it("should update the ai agent and return updated data", async () => {
    const existing = makeAiAgent();
    const updated = makeAiAgent({ name: "Updated", _version: 2 });
    mockRepository.findById.mockResolvedValue(ok({ data: existing }));
    mockRepository.update.mockResolvedValue(ok({ data: updated }));

    const result = await aiAgentService.update({
      ctx,
      id: TEST_ID,
      data: { name: "Updated", _version: 1 },
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: updated } as never);
    expect(mockRepository.update).toHaveBeenCalledWith({
      ctx,
      id: TEST_ID,
      data: expect.objectContaining({ name: "Updated", _version: 1 }),
    });
  });

  it("should return notFound err when ai agent does not exist", async () => {
    mockRepository.findById.mockResolvedValue(ok({ data: null }));

    const result = await aiAgentService.update({
      ctx,
      id: TEST_ID,
      data: { name: "Updated", _version: 1 },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
    expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
  });

  it("should return err when repository update fails", async () => {
    const existing = makeAiAgent();
    mockRepository.findById.mockResolvedValue(ok({ data: existing }));
    mockRepository.update.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await aiAgentService.update({
      ctx,
      id: TEST_ID,
      data: { name: "Updated", _version: 1 },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("deleteAiAgent", () => {
  beforeEach(resetMocks);

  it("should delete the ai agent by id and tenant", async () => {
    mockRepository.deleteById.mockResolvedValue(ok());

    const result = await aiAgentService.delete({ ctx, id: TEST_ID });

    expect(result.isOk()).toBe(true);
    expect(mockRepository.deleteById).toHaveBeenCalledWith({
      ctx,
      id: TEST_ID,
    });
  });

  it("should return err when repository delete fails", async () => {
    mockRepository.deleteById.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await aiAgentService.delete({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});
