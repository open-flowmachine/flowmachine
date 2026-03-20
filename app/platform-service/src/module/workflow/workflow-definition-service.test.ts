import { beforeEach, describe, expect, it, mock } from "bun:test";
import { err, ok } from "neverthrow";
import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-model";
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

mock.module("@/module/workflow/workflow-definition-repository", () => ({
  workflowDefinitionRepository: mockRepository,
}));

mock.module("@/shared/model/model-id", () => ({
  idSchema,
  newId: () => NEW_ID,
}));

const { makeWorkflowDefinitionService } = await import("./workflow-definition-service");
const workflowDefinitionService = makeWorkflowDefinitionService();

// --- Helpers ---

const now = new Date("2026-01-01");

const makeWorkflowDefinition = (
  overrides?: Partial<WorkflowDefinition>,
): WorkflowDefinition => ({
  id: TEST_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  name: "My Workflow",
  description: "A test workflow",
  projects: [],
  actions: [{ id: "action-1", kind: "research", name: "Research" }],
  edges: [],
  isActive: true,
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

describe("createWorkflowDefinition", () => {
  beforeEach(resetMocks);

  it("should insert a new workflow definition with generated id and timestamps", async () => {
    mockRepository.insert.mockResolvedValue(ok());

    const result = await workflowDefinitionService.create({
      ctx,
      payload: {
        name: "New Workflow",
        description: "Description",
        projects: [],
        actions: [{ id: "a1", kind: "research", name: "Research" }],
        edges: [],
        isActive: true,
      },
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ id: NEW_ID });
    expect(mockRepository.insert).toHaveBeenCalledWith({
      ctx,
      data: expect.objectContaining({
        id: NEW_ID,
        _version: 1,
        name: "New Workflow",
        description: "Description",
        projects: [],
        actions: [{ id: "a1", kind: "research", name: "Research" }],
        edges: [],
        isActive: true,
      }),
    });
  });

  it("should return err when repository insert fails", async () => {
    mockRepository.insert.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await workflowDefinitionService.create({
      ctx,
      payload: {
        name: "New Workflow",
        projects: [],
        actions: [],
        edges: [],
        isActive: true,
      },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("getWorkflowDefinition", () => {
  beforeEach(resetMocks);

  it("should return the workflow definition when found", async () => {
    const definition = makeWorkflowDefinition();
    mockRepository.findById.mockResolvedValue(ok({ data: definition }));

    const result = await workflowDefinitionService.get({ ctx, id: TEST_ID });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: definition } as never);
    expect(mockRepository.findById).toHaveBeenCalledWith({
      ctx,
      id: TEST_ID,
    });
  });

  it("should return notFound err when workflow definition does not exist", async () => {
    mockRepository.findById.mockResolvedValue(ok({ data: null }));

    const result = await workflowDefinitionService.get({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
    expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
  });

  it("should return err when repository fails", async () => {
    mockRepository.findById.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await workflowDefinitionService.get({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("listWorkflowDefinitions", () => {
  beforeEach(resetMocks);

  it("should return all workflow definitions for the tenant", async () => {
    const definitions = [
      makeWorkflowDefinition(),
      makeWorkflowDefinition({ name: "Second" }),
    ];
    mockRepository.findMany.mockResolvedValue(ok({ data: definitions }));

    const result = await workflowDefinitionService.list({ ctx });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: definitions } as never);
    expect(mockRepository.findMany).toHaveBeenCalledWith({ ctx });
  });

  it("should return err when repository fails", async () => {
    mockRepository.findMany.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await workflowDefinitionService.list({ ctx });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("updateWorkflowDefinition", () => {
  beforeEach(resetMocks);

  it("should update the workflow definition and return updated data", async () => {
    const existing = makeWorkflowDefinition();
    const updated = makeWorkflowDefinition({ name: "Updated", _version: 2 });
    mockRepository.findById.mockResolvedValue(ok({ data: existing }));
    mockRepository.update.mockResolvedValue(ok({ data: updated }));

    const result = await workflowDefinitionService.update({
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

  it("should return notFound err when workflow definition does not exist", async () => {
    mockRepository.findById.mockResolvedValue(ok({ data: null }));

    const result = await workflowDefinitionService.update({
      ctx,
      id: TEST_ID,
      data: { name: "Updated", _version: 1 },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
    expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
  });

  it("should return err when repository update fails", async () => {
    const existing = makeWorkflowDefinition();
    mockRepository.findById.mockResolvedValue(ok({ data: existing }));
    mockRepository.update.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await workflowDefinitionService.update({
      ctx,
      id: TEST_ID,
      data: { name: "Updated", _version: 1 },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("deleteWorkflowDefinition", () => {
  beforeEach(resetMocks);

  it("should delete the workflow definition by id and tenant", async () => {
    mockRepository.deleteById.mockResolvedValue(ok());

    const result = await workflowDefinitionService.delete({ ctx, id: TEST_ID });

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

    const result = await workflowDefinitionService.delete({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});
