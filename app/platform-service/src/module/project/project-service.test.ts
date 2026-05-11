import { afterAll, beforeEach, expect, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { Project } from "@/module/project/project-model";
import type { Tenant } from "@/shared/tenant/tenant-model";

import { projectRepository } from "@/module/project/project-repository";
import { makeProjectService } from "@/module/project/project-service";
import { Err } from "@/shared/err/err";
import * as modelIdModule from "@/shared/model/model-id";
import { type Id } from "@/shared/model/model-id";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const NEW_ID = "019606a0-0000-7000-8000-000000000002" as Id;

const tenant: Tenant = { id: TEST_ID, type: "organization" };
const ctx = { tenant };

const mockRepository = {
  findMany: spyOn(projectRepository, "findMany"),
  findById: spyOn(projectRepository, "findById"),
  insert: spyOn(projectRepository, "insert"),
  update: spyOn(projectRepository, "update"),
  deleteById: spyOn(projectRepository, "deleteById"),
};

const newIdSpy = spyOn(modelIdModule, "newId");

const projectService = makeProjectService();

// --- Helpers ---

const now = new Date("2026-01-01");

const makeProject = (overrides?: Partial<Project>): Project => ({
  id: TEST_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  name: "My Project",
  integration: null,
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

test("create: given valid payload, when inserted, then returns new project id and calls repository with correct data", async () => {
  // given
  mockRepository.insert.mockResolvedValue(ok());

  // when
  const result = await projectService.create({
    ctx,
    payload: { name: "New Project", integration: null },
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ id: NEW_ID });
  expect(mockRepository.insert).toHaveBeenCalledWith({
    ctx,
    data: expect.objectContaining({
      id: NEW_ID,
      _version: 1,
      name: "New Project",
      integration: null,
    }),
  });
});

test("create: given repository insert fails, when inserted, then returns err", async () => {
  // given
  mockRepository.insert.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await projectService.create({
    ctx,
    payload: { name: "New Project", integration: null },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("get: given project exists, when fetched by id, then returns the project", async () => {
  // given
  const project = makeProject();
  mockRepository.findById.mockResolvedValue(ok({ data: project }));

  // when
  const result = await projectService.get({ ctx, id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: project } as never);
  expect(mockRepository.findById).toHaveBeenCalledWith({ ctx, id: TEST_ID });
});

test("get: given project does not exist, when fetched by id, then returns notFound err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(ok({ data: null }));

  // when
  const result = await projectService.get({ ctx, id: TEST_ID });

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
  const result = await projectService.get({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("list: given repository returns projects, when listed, then returns all projects for the tenant", async () => {
  // given
  const projects = [makeProject(), makeProject({ name: "Second" })];
  mockRepository.findMany.mockResolvedValue(ok({ data: projects }));

  // when
  const result = await projectService.list({ ctx });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: projects } as never);
  expect(mockRepository.findMany).toHaveBeenCalledWith({ ctx });
});

test("list: given repository fails, when listed, then returns err", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await projectService.list({ ctx });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("update: given project exists, when updated, then returns updated data", async () => {
  // given
  const existing = makeProject();
  const updated = makeProject({ name: "Updated", _version: 2 });
  mockRepository.findById.mockResolvedValue(ok({ data: existing }));
  mockRepository.update.mockResolvedValue(ok({ data: updated }));

  // when
  const result = await projectService.update({
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

test("update: given project does not exist, when updated, then returns notFound err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(ok({ data: null }));

  // when
  const result = await projectService.update({
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
  const existing = makeProject();
  mockRepository.findById.mockResolvedValue(ok({ data: existing }));
  mockRepository.update.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await projectService.update({
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
  const result = await projectService.delete({ ctx, id: TEST_ID });

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
  const result = await projectService.delete({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});
