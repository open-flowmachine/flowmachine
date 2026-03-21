import { beforeEach, describe, expect, it, mock } from "bun:test";
import { err, ok } from "neverthrow";
import type { ProjectIssueFieldDefinition } from "@/module/project/project-issue-field-definition-model";
import { Err } from "@/shared/err/err";
import { type Id, idSchema } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const NEW_ID = "019606a0-0000-7000-8000-000000000002" as Id;
const PROJECT_ID = "019606a0-0000-7000-8000-000000000099" as Id;

const tenant: Tenant = { id: TEST_ID, type: "organization" };
const ctx = { tenant };

const mockRepository = {
  findMany: mock(),
  findById: mock(),
  insert: mock(),
  update: mock(),
  deleteById: mock(),
};

mock.module(
  "@/module/project/project-issue-field-definition-repository",
  () => ({
    projectIssueFieldDefinitionRepository: mockRepository,
  }),
);

mock.module("@/shared/model/model-id", () => ({
  idSchema,
  newId: () => NEW_ID,
}));

const { makeProjectIssueFieldDefinitionService } = await import(
  "./project-issue-field-definition-service"
);
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
  mockRepository.findMany.mockClear();
  mockRepository.findById.mockClear();
  mockRepository.insert.mockClear();
  mockRepository.update.mockClear();
  mockRepository.deleteById.mockClear();
};

// --- Tests ---

describe("listProjectIssueFieldDefinitions", () => {
  beforeEach(resetMocks);

  it("should return all field definitions for the tenant", async () => {
    const definitions = [makeFieldDefinition()];
    mockRepository.findMany.mockResolvedValue(ok({ data: definitions }));

    const result = await service.list({ ctx });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: definitions } as never);
  });

  it("should pass projectId filter as project.id", async () => {
    mockRepository.findMany.mockResolvedValue(ok({ data: [] }));

    const result = await service.list({
      ctx,
      filter: { projectId: PROJECT_ID },
    });

    expect(result.isOk()).toBe(true);
    expect(mockRepository.findMany).toHaveBeenCalledWith({
      ctx,
      filter: { "project.id": PROJECT_ID },
    });
  });

  it("should pass name filter", async () => {
    mockRepository.findMany.mockResolvedValue(ok({ data: [] }));

    const result = await service.list({
      ctx,
      filter: { name: "AI Agent" },
    });

    expect(result.isOk()).toBe(true);
    expect(mockRepository.findMany).toHaveBeenCalledWith({
      ctx,
      filter: { name: "AI Agent" },
    });
  });

  it("should combine projectId and name filters", async () => {
    mockRepository.findMany.mockResolvedValue(ok({ data: [] }));

    const result = await service.list({
      ctx,
      filter: { projectId: PROJECT_ID, name: "Git Repository" },
    });

    expect(result.isOk()).toBe(true);
    expect(mockRepository.findMany).toHaveBeenCalledWith({
      ctx,
      filter: { "project.id": PROJECT_ID, name: "Git Repository" },
    });
  });

  it("should pass no filter when filter is omitted", async () => {
    mockRepository.findMany.mockResolvedValue(ok({ data: [] }));

    const result = await service.list({ ctx });

    expect(result.isOk()).toBe(true);
    expect(mockRepository.findMany).toHaveBeenCalledWith({
      ctx,
      filter: undefined,
    });
  });

  it("should return err when repository fails", async () => {
    mockRepository.findMany.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await service.list({ ctx });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});
