import { afterAll, beforeEach, expect, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { ProjectIssueFieldDefinition } from "@/module/project/project-issue-field-definition-model";
import type { Tenant } from "@/shared/tenant/tenant-model";

import { projectIssueFieldDefinitionRepository } from "@/module/project/project-issue-field-definition-repository";
import { makeProjectIssueFieldDefinitionService } from "@/module/project/project-issue-field-definition-service";
import { Err } from "@/shared/err/err";
import * as modelIdModule from "@/shared/model/model-id";
import { type Id } from "@/shared/model/model-id";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const NEW_ID = "019606a0-0000-7000-8000-000000000002" as Id;
const PROJECT_ID = "019606a0-0000-7000-8000-000000000099" as Id;

const tenant: Tenant = { id: TEST_ID, type: "organization" };
const ctx = { tenant };

const mockRepository = {
  findMany: spyOn(projectIssueFieldDefinitionRepository, "findMany"),
  findById: spyOn(projectIssueFieldDefinitionRepository, "findById"),
  insert: spyOn(projectIssueFieldDefinitionRepository, "insert"),
  update: spyOn(projectIssueFieldDefinitionRepository, "update"),
  deleteById: spyOn(projectIssueFieldDefinitionRepository, "deleteById"),
};

const newIdSpy = spyOn(modelIdModule, "newId");

const service = makeProjectIssueFieldDefinitionService();

// --- Helpers ---

const now = new Date("2026-01-01");

const makeFieldDefinition = (
  overrides?: Partial<ProjectIssueFieldDefinition>,
): ProjectIssueFieldDefinition => ({
  id: TEST_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  name: "AI Agent",
  type: "select",
  options: [{ value: "opt-1", label: "Option 1" }],
  integration: null,
  project: { id: PROJECT_ID },
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

test("list: given repository returns definitions, when listed, then returns all field definitions for the tenant", async () => {
  // given
  const definitions = [makeFieldDefinition()];
  mockRepository.findMany.mockResolvedValue(ok({ data: definitions }));

  // when
  const result = await service.list({ ctx });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: definitions } as never);
});

test("list: given a projectId filter, when listed, then passes project.id to repository", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(ok({ data: [] }));

  // when
  const result = await service.list({
    ctx,
    filter: { projectId: PROJECT_ID },
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockRepository.findMany).toHaveBeenCalledWith({
    ctx,
    filter: { "project.id": PROJECT_ID },
  });
});

test("list: given a name filter, when listed, then passes name to repository", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(ok({ data: [] }));

  // when
  const result = await service.list({
    ctx,
    filter: { name: "AI Agent" },
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockRepository.findMany).toHaveBeenCalledWith({
    ctx,
    filter: { name: "AI Agent" },
  });
});

test("list: given projectId and name filters, when listed, then passes both to repository", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(ok({ data: [] }));

  // when
  const result = await service.list({
    ctx,
    filter: { projectId: PROJECT_ID, name: "Git Repository" },
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockRepository.findMany).toHaveBeenCalledWith({
    ctx,
    filter: { "project.id": PROJECT_ID, name: "Git Repository" },
  });
});

test("list: given no filter, when listed, then passes undefined filter to repository", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(ok({ data: [] }));

  // when
  const result = await service.list({ ctx });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockRepository.findMany).toHaveBeenCalledWith({
    ctx,
    filter: undefined,
  });
});

test("list: given repository fails, when listed, then returns err", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await service.list({ ctx });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("create: given valid payload, when inserted, then returns new id and calls repository with model fields", async () => {
  // given
  mockRepository.insert.mockResolvedValue(ok());

  // when
  const result = await service.create({
    ctx,
    payload: {
      name: "Priority",
      type: "select",
      options: [{ value: "high", label: "High" }],
      integration: null,
      project: { id: PROJECT_ID },
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
      name: "Priority",
      type: "select",
      options: [{ value: "high", label: "High" }],
      integration: null,
      project: { id: PROJECT_ID },
    }),
  });
});

test("create: given repository insert fails, when inserted, then returns err", async () => {
  // given
  mockRepository.insert.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await service.create({
    ctx,
    payload: {
      name: "Priority",
      type: "select",
      options: [],
      integration: null,
      project: { id: PROJECT_ID },
    },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("get: given definition exists, when fetched by id, then returns the definition", async () => {
  // given
  const definition = makeFieldDefinition();
  mockRepository.findById.mockResolvedValue(ok({ data: definition }));

  // when
  const result = await service.get({ ctx, id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: definition } as never);
  expect(mockRepository.findById).toHaveBeenCalledWith({ ctx, id: TEST_ID });
});

test("get: given definition does not exist, when fetched by id, then returns notFound err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(ok({ data: null }));

  // when
  const result = await service.get({ ctx, id: TEST_ID });

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
  const result = await service.get({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("update: given definition exists, when updated, then returns updated data", async () => {
  // given
  const existing = makeFieldDefinition();
  const updated = makeFieldDefinition({ name: "Updated", _version: 2 });
  mockRepository.findById.mockResolvedValue(ok({ data: existing }));
  mockRepository.update.mockResolvedValue(ok({ data: updated }));

  // when
  const result = await service.update({
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
    expectedVersion: 1,
  });
});

test("update: given definition does not exist, when updated, then returns notFound err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(ok({ data: null }));

  // when
  const result = await service.update({
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
  const existing = makeFieldDefinition();
  mockRepository.findById.mockResolvedValue(ok({ data: existing }));
  mockRepository.update.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await service.update({
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
  const result = await service.delete({ ctx, id: TEST_ID });

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
  const result = await service.delete({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});
