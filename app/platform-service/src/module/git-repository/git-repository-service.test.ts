import { afterAll, beforeEach, expect, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { GitRepository } from "@/module/git-repository/git-repository-model";
import type { Tenant } from "@/shared/model/model-tenant";

import { gitRepositoryRepository } from "@/module/git-repository/git-repository-repository";
import { makeGitRepositoryService } from "@/module/git-repository/git-repository-service";
import { Err } from "@/shared/err/err";
import * as modelIdModule from "@/shared/model/model-id";
import { type Id } from "@/shared/model/model-id";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const NEW_ID = "019606a0-0000-7000-8000-000000000002" as Id;
const PROJECT_ID = "019606a0-0000-7000-8000-000000000003" as Id;

const tenant: Tenant = { id: TEST_ID, type: "organization" };
const ctx = { tenant };

const mockRepository = {
  findMany: spyOn(gitRepositoryRepository, "findMany"),
  findById: spyOn(gitRepositoryRepository, "findById"),
  insert: spyOn(gitRepositoryRepository, "insert"),
  update: spyOn(gitRepositoryRepository, "update"),
  deleteById: spyOn(gitRepositoryRepository, "deleteById"),
};

const newIdSpy = spyOn(modelIdModule, "newId");

const gitRepositoryService = makeGitRepositoryService();

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

test("create: given a valid payload, when inserted, then returns the new id", async () => {
  // given
  mockRepository.insert.mockResolvedValue(ok());

  // when
  const result = await gitRepositoryService.create({
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

  // then
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

test("create: given a valid payload, when repository insert fails, then returns err", async () => {
  // given
  mockRepository.insert.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await gitRepositoryService.create({
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

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("get: given an existing git repository id, when fetched, then returns the git repository", async () => {
  // given
  const gitRepo = makeGitRepository();
  mockRepository.findById.mockResolvedValue(ok({ data: gitRepo }));

  // when
  const result = await gitRepositoryService.get({ ctx, id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: gitRepo } as never);
  expect(mockRepository.findById).toHaveBeenCalledWith({
    ctx,
    id: TEST_ID,
  });
});

test("get: given a non-existent git repository id, when fetched, then returns notFound err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(ok({ data: null }));

  // when
  const result = await gitRepositoryService.get({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
});

test("get: given a valid id, when repository fails, then returns err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await gitRepositoryService.get({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("list: given existing git repositories, when listed, then returns all repositories for the tenant", async () => {
  // given
  const repos = [
    makeGitRepository(),
    makeGitRepository({ name: "Second Repo" }),
  ];
  mockRepository.findMany.mockResolvedValue(ok({ data: repos }));

  // when
  const result = await gitRepositoryService.list({ ctx });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: repos } as never);
  expect(mockRepository.findMany).toHaveBeenCalledWith({
    ctx,
    filter: undefined,
  });
});

test("list: given a projectId filter, when listed, then passes projects.id filter to repository", async () => {
  // given
  const repos = [makeGitRepository()];
  mockRepository.findMany.mockResolvedValue(ok({ data: repos }));

  // when
  const result = await gitRepositoryService.list({
    ctx,
    filter: { projectId: PROJECT_ID },
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: repos } as never);
  expect(mockRepository.findMany).toHaveBeenCalledWith({
    ctx,
    filter: { "projects.id": PROJECT_ID },
  });
});

test("list: given a tenant, when repository fails, then returns err", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await gitRepositoryService.list({ ctx });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("update: given an existing git repository, when updated, then returns the updated data", async () => {
  // given
  const existing = makeGitRepository();
  const updated = makeGitRepository({ name: "Updated", _version: 2 });
  mockRepository.findById.mockResolvedValue(ok({ data: existing }));
  mockRepository.update.mockResolvedValue(ok({ data: updated }));

  // when
  const result = await gitRepositoryService.update({
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

test("update: given a non-existent git repository id, when updated, then returns notFound err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(ok({ data: null }));

  // when
  const result = await gitRepositoryService.update({
    ctx,
    id: TEST_ID,
    data: { name: "Updated", _version: 1 },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
});

test("update: given an existing git repository, when repository update fails, then returns err", async () => {
  // given
  const existing = makeGitRepository();
  mockRepository.findById.mockResolvedValue(ok({ data: existing }));
  mockRepository.update.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await gitRepositoryService.update({
    ctx,
    id: TEST_ID,
    data: { name: "Updated", _version: 1 },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("delete: given an existing git repository id, when deleted, then succeeds", async () => {
  // given
  mockRepository.deleteById.mockResolvedValue(ok());

  // when
  const result = await gitRepositoryService.delete({ ctx, id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockRepository.deleteById).toHaveBeenCalledWith({
    ctx,
    id: TEST_ID,
  });
});

test("delete: given a valid id, when repository delete fails, then returns err", async () => {
  // given
  mockRepository.deleteById.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await gitRepositoryService.delete({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});
