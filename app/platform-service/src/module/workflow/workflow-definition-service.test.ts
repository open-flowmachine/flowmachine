import { afterAll, beforeEach, expect, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-model";
import type { Tenant } from "@/shared/model/model-tenant";

import { workflowDefinitionRepository } from "@/module/workflow/workflow-definition-repository";
import { makeWorkflowDefinitionService } from "@/module/workflow/workflow-definition-service";
import { Err } from "@/shared/err/err";
import * as modelIdModule from "@/shared/model/model-id";
import { type Id } from "@/shared/model/model-id";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const NEW_ID = "019606a0-0000-7000-8000-000000000002" as Id;

const tenant: Tenant = { id: TEST_ID, type: "organization" };
const ctx = { tenant };

const mockRepository = {
  findMany: spyOn(workflowDefinitionRepository, "findMany"),
  findById: spyOn(workflowDefinitionRepository, "findById"),
  insert: spyOn(workflowDefinitionRepository, "insert"),
  update: spyOn(workflowDefinitionRepository, "update"),
  deleteById: spyOn(workflowDefinitionRepository, "deleteById"),
};

const newIdSpy = spyOn(modelIdModule, "newId");

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

test("create: given valid payload, when inserted, then returns new workflow definition id and calls repository with correct data", async () => {
  // given
  mockRepository.insert.mockResolvedValue(ok());

  // when
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

  // then
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

test("create: given repository insert fails, when inserted, then returns err", async () => {
  // given
  mockRepository.insert.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
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

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("get: given workflow definition exists, when fetched by id, then returns the definition", async () => {
  // given
  const definition = makeWorkflowDefinition();
  mockRepository.findById.mockResolvedValue(ok({ data: definition }));

  // when
  const result = await workflowDefinitionService.get({ ctx, id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: definition } as never);
  expect(mockRepository.findById).toHaveBeenCalledWith({
    ctx,
    id: TEST_ID,
  });
});

test("get: given workflow definition does not exist, when fetched by id, then returns notFound err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(ok({ data: null }));

  // when
  const result = await workflowDefinitionService.get({ ctx, id: TEST_ID });

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
  const result = await workflowDefinitionService.get({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("list: given repository returns definitions, when listed, then returns all workflow definitions for the tenant", async () => {
  // given
  const definitions = [
    makeWorkflowDefinition(),
    makeWorkflowDefinition({ name: "Second" }),
  ];
  mockRepository.findMany.mockResolvedValue(ok({ data: definitions }));

  // when
  const result = await workflowDefinitionService.list({ ctx });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: definitions } as never);
  expect(mockRepository.findMany).toHaveBeenCalledWith({ ctx });
});

test("list: given repository fails, when listed, then returns err", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await workflowDefinitionService.list({ ctx });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("list: given a projectId filter, when listed, then passes projects.id to repository", async () => {
  // given
  const PROJECT_ID = "019606a0-0000-7000-8000-000000000099" as Id;
  mockRepository.findMany.mockResolvedValue(ok({ data: [] }));

  // when
  const result = await workflowDefinitionService.list({
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
  const result = await workflowDefinitionService.list({ ctx });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockRepository.findMany).toHaveBeenCalledWith({
    ctx,
    filter: undefined,
  });
});

test("update: given workflow definition exists, when updated, then returns updated data", async () => {
  // given
  const existing = makeWorkflowDefinition();
  const updated = makeWorkflowDefinition({ name: "Updated", _version: 2 });
  mockRepository.findById.mockResolvedValue(ok({ data: existing }));
  mockRepository.update.mockResolvedValue(ok({ data: updated }));

  // when
  const result = await workflowDefinitionService.update({
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

test("update: given workflow definition does not exist, when updated, then returns notFound err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(ok({ data: null }));

  // when
  const result = await workflowDefinitionService.update({
    ctx,
    id: TEST_ID,
    data: { name: "Updated", _version: 1 },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
});

test("update: given repository update fails, when updated, then returns err", async () => {
  // given
  const existing = makeWorkflowDefinition();
  mockRepository.findById.mockResolvedValue(ok({ data: existing }));
  mockRepository.update.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await workflowDefinitionService.update({
    ctx,
    id: TEST_ID,
    data: { name: "Updated", _version: 1 },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("delete: given valid id, when deleted, then calls repository deleteById", async () => {
  // given
  mockRepository.deleteById.mockResolvedValue(ok());

  // when
  const result = await workflowDefinitionService.delete({ ctx, id: TEST_ID });

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
  const result = await workflowDefinitionService.delete({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});
