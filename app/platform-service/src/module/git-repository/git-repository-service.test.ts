import { beforeEach, describe, expect, it, mock } from "bun:test";
import { err, ok } from "neverthrow";
import type { GitRepository } from "@/module/git-repository/git-repository-model";
import { Err } from "@/shared/err/err";
import { type Id, idSchema } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const NEW_ID = "019606a0-0000-7000-8000-000000000002" as Id;
const PROJECT_ID = "019606a0-0000-7000-8000-000000000003" as Id;

const tenant: Tenant = { id: TEST_ID, type: "organization" };
const ctx = { tenant };

const mockRepository = {
  findMany: mock(),
  findById: mock(),
  insert: mock(),
  update: mock(),
  deleteById: mock(),
};

mock.module("@/module/git-repository/git-repository-repository", () => ({
  gitRepositoryRepository: mockRepository,
}));

mock.module("@/shared/model/model-id", () => ({
  idSchema,
  newId: () => NEW_ID,
}));

const {
  createGitRepository,
  getGitRepository,
  listGitRepositories,
  updateGitRepository,
  deleteGitRepository,
} = await import("./git-repository-service");

// --- Helpers ---

const now = new Date("2026-01-01");

const makeGitRepository = (
  overrides?: Partial<GitRepository>,
): GitRepository => ({
  id: TEST_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  name: "My Repo",
  url: "https://github.com/org/repo",
  config: {
    defaultBranch: "main",
    email: "dev@example.com",
    username: "dev",
  },
  integration: {
    provider: "github",
    credentialId: TEST_ID,
  },
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

describe("createGitRepository", () => {
  beforeEach(resetMocks);

  it("should insert a new git repository with generated id and timestamps", async () => {
    mockRepository.insert.mockResolvedValue(ok());

    const result = await createGitRepository({
      ctx,
      payload: {
        name: "New Repo",
        url: "https://github.com/org/new-repo",
        config: {
          defaultBranch: "main",
          email: "dev@example.com",
          username: "dev",
        },
        integration: {
          provider: "github",
          credentialId: TEST_ID,
        },
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
        name: "New Repo",
        url: "https://github.com/org/new-repo",
      }),
    });
  });

  it("should return err when repository insert fails", async () => {
    mockRepository.insert.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await createGitRepository({
      ctx,
      payload: {
        name: "New Repo",
        url: "https://github.com/org/new-repo",
        config: {
          defaultBranch: "main",
          email: "dev@example.com",
          username: "dev",
        },
        integration: {
          provider: "github",
          credentialId: TEST_ID,
        },
        projects: [],
      },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("getGitRepository", () => {
  beforeEach(resetMocks);

  it("should return the git repository when found", async () => {
    const gitRepo = makeGitRepository();
    mockRepository.findById.mockResolvedValue(ok({ data: gitRepo }));

    const result = await getGitRepository({ ctx, id: TEST_ID });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: gitRepo } as never);
    expect(mockRepository.findById).toHaveBeenCalledWith({
      ctx,
      id: TEST_ID,
    });
  });

  it("should return notFound err when git repository does not exist", async () => {
    mockRepository.findById.mockResolvedValue(ok({ data: null }));

    const result = await getGitRepository({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
    expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
  });

  it("should return err when repository fails", async () => {
    mockRepository.findById.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await getGitRepository({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("listGitRepositories", () => {
  beforeEach(resetMocks);

  it("should return all git repositories for the tenant", async () => {
    const repos = [
      makeGitRepository(),
      makeGitRepository({ name: "Second Repo" }),
    ];
    mockRepository.findMany.mockResolvedValue(ok({ data: repos }));

    const result = await listGitRepositories({ ctx });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: repos } as never);
    expect(mockRepository.findMany).toHaveBeenCalledWith({
      ctx,
      filter: undefined,
    });
  });

  it("should pass projectId filter as MongoDB query to findMany", async () => {
    const repos = [makeGitRepository()];
    mockRepository.findMany.mockResolvedValue(ok({ data: repos }));

    const result = await listGitRepositories({
      ctx,
      filter: { projectId: PROJECT_ID },
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: repos } as never);
    expect(mockRepository.findMany).toHaveBeenCalledWith({
      ctx,
      filter: { "projects.id": PROJECT_ID },
    });
  });

  it("should return err when repository fails", async () => {
    mockRepository.findMany.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await listGitRepositories({ ctx });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("updateGitRepository", () => {
  beforeEach(resetMocks);

  it("should update the git repository and return updated data", async () => {
    const existing = makeGitRepository();
    const updated = makeGitRepository({ name: "Updated", _version: 2 });
    mockRepository.findById.mockResolvedValue(ok({ data: existing }));
    mockRepository.update.mockResolvedValue(ok({ data: updated }));

    const result = await updateGitRepository({
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

  it("should return notFound err when git repository does not exist", async () => {
    mockRepository.findById.mockResolvedValue(ok({ data: null }));

    const result = await updateGitRepository({
      ctx,
      id: TEST_ID,
      data: { name: "Updated", _version: 1 },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
    expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
  });

  it("should return err when repository update fails", async () => {
    const existing = makeGitRepository();
    mockRepository.findById.mockResolvedValue(ok({ data: existing }));
    mockRepository.update.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await updateGitRepository({
      ctx,
      id: TEST_ID,
      data: { name: "Updated", _version: 1 },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("deleteGitRepository", () => {
  beforeEach(resetMocks);

  it("should delete the git repository by id and tenant", async () => {
    mockRepository.deleteById.mockResolvedValue(ok());

    const result = await deleteGitRepository({ ctx, id: TEST_ID });

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

    const result = await deleteGitRepository({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});
