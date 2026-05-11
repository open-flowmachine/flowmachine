import { afterAll, beforeEach, expect, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { WorkflowExecution } from "@/module/workflow/workflow-execution-model";
import type { Tenant } from "@/shared/tenant/tenant-model";

import { workflowExecutionRepository } from "@/module/workflow/workflow-execution-repository";
import { makeWorkflowExecutionService } from "@/module/workflow/workflow-execution-service";
import { Err } from "@/shared/err/err";
import * as modelIdModule from "@/shared/model/model-id";
import { type Id } from "@/shared/model/model-id";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const NEW_ID = "019606a0-0000-7000-8000-000000000002" as Id;

const tenant: Tenant = { id: TEST_ID, type: "organization" };
const ctx = { tenant };

const mockRepository = {
  findMany: spyOn(workflowExecutionRepository, "findMany"),
  findById: spyOn(workflowExecutionRepository, "findById"),
  insert: spyOn(workflowExecutionRepository, "insert"),
  update: spyOn(workflowExecutionRepository, "update"),
  deleteById: spyOn(workflowExecutionRepository, "deleteById"),
};

const newIdSpy = spyOn(modelIdModule, "newId");

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

test("create: given valid payload, when inserted, then returns new workflow execution id and calls repository with correct data", async () => {
  // given
  mockRepository.insert.mockResolvedValue(ok());

  // when
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

  // then
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

test("create: given repository insert fails, when inserted, then returns err", async () => {
  // given
  mockRepository.insert.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
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

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("get: given workflow execution exists, when fetched by id, then returns the execution", async () => {
  // given
  const execution = makeWorkflowExecution();
  mockRepository.findById.mockResolvedValue(ok({ data: execution }));

  // when
  const result = await workflowExecutionService.get({ ctx, id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: execution } as never);
  expect(mockRepository.findById).toHaveBeenCalledWith({
    ctx,
    id: TEST_ID,
  });
});

test("get: given workflow execution does not exist, when fetched by id, then returns notFound err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(ok({ data: null }));

  // when
  const result = await workflowExecutionService.get({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
});

test("get: given repository fails, when fetched by id, then returns err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await workflowExecutionService.get({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("list: given repository returns executions, when listed, then returns all workflow executions for the tenant", async () => {
  // given
  const executions = [
    makeWorkflowExecution(),
    makeWorkflowExecution({
      integration: { externalId: "ext-789", provider: "inngest" },
    }),
  ];
  mockRepository.findMany.mockResolvedValue(ok({ data: executions }));

  // when
  const result = await workflowExecutionService.list({ ctx });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: executions } as never);
  expect(mockRepository.findMany).toHaveBeenCalledWith({ ctx });
});

test("list: given repository fails, when listed, then returns err", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await workflowExecutionService.list({ ctx });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("list: given a workflowDefinitionId filter, when listed, then passes workflowDefinition.id to repository", async () => {
  // given
  const DEFINITION_ID = "019606a0-0000-7000-8000-000000000099" as Id;
  mockRepository.findMany.mockResolvedValue(ok({ data: [] }));

  // when
  const result = await workflowExecutionService.list({
    ctx,
    filter: { workflowDefinitionId: DEFINITION_ID },
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockRepository.findMany).toHaveBeenCalledWith({
    ctx,
    filter: { "workflowDefinition.id": DEFINITION_ID },
  });
});

test("list: given no filter, when listed, then passes undefined filter to repository", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(ok({ data: [] }));

  // when
  const result = await workflowExecutionService.list({ ctx });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockRepository.findMany).toHaveBeenCalledWith({
    ctx,
    filter: undefined,
  });
});

test("update: given workflow execution exists, when updated, then returns updated data", async () => {
  // given
  const existing = makeWorkflowExecution();
  const updated = makeWorkflowExecution({
    integration: { externalId: "ext-updated", provider: "inngest" },
    _version: 2,
  });
  mockRepository.findById.mockResolvedValue(ok({ data: existing }));
  mockRepository.update.mockResolvedValue(ok({ data: updated }));

  // when
  const result = await workflowExecutionService.update({
    ctx,
    id: TEST_ID,
    data: {
      integration: { externalId: "ext-updated", provider: "inngest" },
      _version: 1,
    },
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: updated } as never);
  expect(mockRepository.update).toHaveBeenCalledWith({
    ctx,
    id: TEST_ID,
    data: expect.objectContaining({
      integration: { externalId: "ext-updated", provider: "inngest" },
      _version: 1,
    }),
    expectedVersion: 1,
  });
});

test("update: given workflow execution does not exist, when updated, then returns notFound err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(ok({ data: null }));

  // when
  const result = await workflowExecutionService.update({
    ctx,
    id: TEST_ID,
    data: {
      integration: { externalId: "ext-updated", provider: "inngest" },
      _version: 1,
    },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
});

test("update: given repository update fails, when updated, then returns err", async () => {
  // given
  const existing = makeWorkflowExecution();
  mockRepository.findById.mockResolvedValue(ok({ data: existing }));
  mockRepository.update.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await workflowExecutionService.update({
    ctx,
    id: TEST_ID,
    data: {
      integration: { externalId: "ext-updated", provider: "inngest" },
      _version: 1,
    },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("delete: given valid id, when deleted, then calls repository deleteById", async () => {
  // given
  mockRepository.deleteById.mockResolvedValue(ok());

  // when
  const result = await workflowExecutionService.delete({
    ctx,
    id: TEST_ID,
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockRepository.deleteById).toHaveBeenCalledWith({
    ctx,
    id: TEST_ID,
  });
});

test("delete: given repository delete fails, when deleted, then returns err", async () => {
  // given
  mockRepository.deleteById.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await workflowExecutionService.delete({
    ctx,
    id: TEST_ID,
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});
