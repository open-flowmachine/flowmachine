import { afterAll, beforeEach, expect, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { ProjectIssueFieldDefinition } from "@/module/project/project-issue-field-definition-model";
import type { Tenant } from "@/shared/model/model-tenant";

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
