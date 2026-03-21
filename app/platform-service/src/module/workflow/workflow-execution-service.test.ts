import { beforeEach, describe, expect, it, mock } from "bun:test";
import { err, ok } from "neverthrow";
import type { WorkflowExecution } from "@/module/workflow/workflow-execution-model";
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

mock.module("@/module/workflow/workflow-execution-repository", () => ({
  workflowExecutionRepository: mockRepository,
}));

mock.module("@/shared/model/model-id", () => ({
  idSchema,
  newId: () => NEW_ID,
}));

const { makeWorkflowExecutionService } = await import(
  "./workflow-execution-service"
);
const workflowExecutionService = makeWorkflowExecutionService();

// --- Helpers ---

const now = new Date("2026-01-01");

const makeWorkflowExecution = (
  overrides?: Partial<WorkflowExecution>,
): WorkflowExecution => ({
  id: TEST_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  integration: {
    externalId: "ext-123",
    provider: "inngest",
  },
  workflowDefinition: {
    id: TEST_ID,
    raw: { steps: [] },
  },
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

describe("createWorkflowExecution", () => {
  beforeEach(resetMocks);

  it("should insert a new workflow execution with generated id and timestamps", async () => {
    mockRepository.insert.mockResolvedValue(ok());

    const result = await workflowExecutionService.create({
      ctx,
      payload: {
        integration: {
          externalId: "ext-456",
          provider: "inngest",
        },
        workflowDefinition: {
          id: TEST_ID,
          raw: { steps: ["a"] },
        },
      },
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ id: NEW_ID });
    expect(mockRepository.insert).toHaveBeenCalledWith({
      ctx,
      data: expect.objectContaining({
        id: NEW_ID,
        _version: 1,
        integration: {
          externalId: "ext-456",
          provider: "inngest",
        },
        workflowDefinition: {
          id: TEST_ID,
          raw: { steps: ["a"] },
        },
      }),
    });
  });

  it("should return err when repository insert fails", async () => {
    mockRepository.insert.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await workflowExecutionService.create({
      ctx,
      payload: {
        integration: {
          externalId: "ext-456",
          provider: "inngest",
        },
        workflowDefinition: {
          id: TEST_ID,
          raw: {},
        },
      },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("getWorkflowExecution", () => {
  beforeEach(resetMocks);

  it("should return the workflow execution when found", async () => {
    const execution = makeWorkflowExecution();
    mockRepository.findById.mockResolvedValue(ok({ data: execution }));

    const result = await workflowExecutionService.get({ ctx, id: TEST_ID });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: execution } as never);
    expect(mockRepository.findById).toHaveBeenCalledWith({
      ctx,
      id: TEST_ID,
    });
  });

  it("should return notFound err when workflow execution does not exist", async () => {
    mockRepository.findById.mockResolvedValue(ok({ data: null }));

    const result = await workflowExecutionService.get({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
    expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
  });

  it("should return err when repository fails", async () => {
    mockRepository.findById.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await workflowExecutionService.get({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("listWorkflowExecutions", () => {
  beforeEach(resetMocks);

  it("should return all workflow executions for the tenant", async () => {
    const executions = [
      makeWorkflowExecution(),
      makeWorkflowExecution({ integration: { externalId: "ext-789", provider: "inngest" } }),
    ];
    mockRepository.findMany.mockResolvedValue(ok({ data: executions }));

    const result = await workflowExecutionService.list({ ctx });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: executions } as never);
    expect(mockRepository.findMany).toHaveBeenCalledWith({ ctx });
  });

  it("should return err when repository fails", async () => {
    mockRepository.findMany.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await workflowExecutionService.list({ ctx });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });

  it("should pass workflowDefinitionId filter to repository as workflowDefinition.id", async () => {
    const DEFINITION_ID = "019606a0-0000-7000-8000-000000000099" as Id;
    mockRepository.findMany.mockResolvedValue(ok({ data: [] }));

    const result = await workflowExecutionService.list({
      ctx,
      filter: { workflowDefinitionId: DEFINITION_ID },
    });

    expect(result.isOk()).toBe(true);
    expect(mockRepository.findMany).toHaveBeenCalledWith({
      ctx,
      filter: { "workflowDefinition.id": DEFINITION_ID },
    });
  });

  it("should pass no filter when filter is omitted", async () => {
    mockRepository.findMany.mockResolvedValue(ok({ data: [] }));

    const result = await workflowExecutionService.list({ ctx });

    expect(result.isOk()).toBe(true);
    expect(mockRepository.findMany).toHaveBeenCalledWith({
      ctx,
      filter: undefined,
    });
  });
});

describe("updateWorkflowExecution", () => {
  beforeEach(resetMocks);

  it("should update the workflow execution and return updated data", async () => {
    const existing = makeWorkflowExecution();
    const updated = makeWorkflowExecution({
      integration: { externalId: "ext-updated", provider: "inngest" },
      _version: 2,
    });
    mockRepository.findById.mockResolvedValue(ok({ data: existing }));
    mockRepository.update.mockResolvedValue(ok({ data: updated }));

    const result = await workflowExecutionService.update({
      ctx,
      id: TEST_ID,
      data: {
        integration: { externalId: "ext-updated", provider: "inngest" },
        _version: 1,
      },
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: updated } as never);
    expect(mockRepository.update).toHaveBeenCalledWith({
      ctx,
      id: TEST_ID,
      data: expect.objectContaining({
        integration: { externalId: "ext-updated", provider: "inngest" },
        _version: 1,
      }),
    });
  });

  it("should return notFound err when workflow execution does not exist", async () => {
    mockRepository.findById.mockResolvedValue(ok({ data: null }));

    const result = await workflowExecutionService.update({
      ctx,
      id: TEST_ID,
      data: {
        integration: { externalId: "ext-updated", provider: "inngest" },
        _version: 1,
      },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
    expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
  });

  it("should return err when repository update fails", async () => {
    const existing = makeWorkflowExecution();
    mockRepository.findById.mockResolvedValue(ok({ data: existing }));
    mockRepository.update.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await workflowExecutionService.update({
      ctx,
      id: TEST_ID,
      data: {
        integration: { externalId: "ext-updated", provider: "inngest" },
        _version: 1,
      },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("deleteWorkflowExecution", () => {
  beforeEach(resetMocks);

  it("should delete the workflow execution by id and tenant", async () => {
    mockRepository.deleteById.mockResolvedValue(ok());

    const result = await workflowExecutionService.delete({
      ctx,
      id: TEST_ID,
    });

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

    const result = await workflowExecutionService.delete({
      ctx,
      id: TEST_ID,
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});
