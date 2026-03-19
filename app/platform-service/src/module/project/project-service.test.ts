import { beforeEach, describe, expect, it, mock } from "bun:test";
import { err, ok } from "neverthrow";
import { Err } from "@/err/err";
import type { Id } from "@/lib/model/model-id";
import type { Tenant } from "@/lib/model/model-tenant";
import type { Project } from "@/module/project/project-model";

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

mock.module("@/module/project/project-repository", () => ({
  projectRepository: mockRepository,
}));

mock.module("@/lib/model/model-id", () => ({
  newId: () => NEW_ID,
}));

const {
  createProject,
  getProject,
  listProjects,
  updateProject,
  deleteProject,
} = await import("./project-service");

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
  mockRepository.findMany.mockClear();
  mockRepository.findById.mockClear();
  mockRepository.insert.mockClear();
  mockRepository.update.mockClear();
  mockRepository.deleteById.mockClear();
};

// --- Tests ---

describe("createProject", () => {
  beforeEach(resetMocks);

  it("should insert a new project with generated id and timestamps", async () => {
    mockRepository.insert.mockResolvedValue(ok());

    const result = await createProject({
      ctx,
      payload: { name: "New Project", integration: null },
    });

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

  it("should return err when repository insert fails", async () => {
    mockRepository.insert.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await createProject({
      ctx,
      payload: { name: "New Project", integration: null },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("getProject", () => {
  beforeEach(resetMocks);

  it("should return the project when found", async () => {
    const project = makeProject();
    mockRepository.findById.mockResolvedValue(ok({ data: project }));

    const result = await getProject({ ctx, id: TEST_ID });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: project } as never);
    expect(mockRepository.findById).toHaveBeenCalledWith({ ctx, id: TEST_ID });
  });

  it("should return notFound err when project does not exist", async () => {
    mockRepository.findById.mockResolvedValue(ok({ data: null }));

    const result = await getProject({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
    expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
  });

  it("should return err when repository fails", async () => {
    mockRepository.findById.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await getProject({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("listProjects", () => {
  beforeEach(resetMocks);

  it("should return all projects for the tenant", async () => {
    const projects = [makeProject(), makeProject({ name: "Second" })];
    mockRepository.findMany.mockResolvedValue(ok({ data: projects }));

    const result = await listProjects({ ctx });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: projects } as never);
    expect(mockRepository.findMany).toHaveBeenCalledWith({ ctx });
  });

  it("should return err when repository fails", async () => {
    mockRepository.findMany.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await listProjects({ ctx });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("updateProject", () => {
  beforeEach(resetMocks);

  it("should update the project and return updated data", async () => {
    const existing = makeProject();
    const updated = makeProject({ name: "Updated", _version: 2 });
    mockRepository.findById.mockResolvedValue(ok({ data: existing }));
    mockRepository.update.mockResolvedValue(ok({ data: updated }));

    const result = await updateProject({
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

  it("should return notFound err when project does not exist", async () => {
    mockRepository.findById.mockResolvedValue(ok({ data: null }));

    const result = await updateProject({
      ctx,
      id: TEST_ID,
      data: { name: "Updated", _version: 1 },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
    expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
  });

  it("should return err when repository update fails", async () => {
    const existing = makeProject();
    mockRepository.findById.mockResolvedValue(ok({ data: existing }));
    mockRepository.update.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await updateProject({
      ctx,
      id: TEST_ID,
      data: { name: "Updated", _version: 1 },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("deleteProject", () => {
  beforeEach(resetMocks);

  it("should delete the project by id and tenant", async () => {
    mockRepository.deleteById.mockResolvedValue(ok());

    const result = await deleteProject({ ctx, id: TEST_ID });

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

    const result = await deleteProject({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});
