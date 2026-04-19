import { beforeEach, expect, mock, test } from "bun:test";
import Elysia from "elysia";
import { err, ok } from "neverthrow";

import type { GitRepository } from "@/module/git-repository/git-repository-model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

import { Err } from "@/shared/err/err";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const PROJECT_ID = "019606a0-0000-7000-8000-000000000003" as Id;
const TENANT: Tenant = { id: TEST_ID, type: "organization" };

const mockCreateGitRepository = mock();
const mockGetGitRepository = mock();
const mockListGitRepositories = mock();
const mockUpdateGitRepository = mock();
const mockDeleteGitRepository = mock();

mock.module("@/module/git-repository/git-repository-service", () => ({
  makeGitRepositoryService: () => ({
    create: mockCreateGitRepository,
    get: mockGetGitRepository,
    list: mockListGitRepositories,
    update: mockUpdateGitRepository,
    delete: mockDeleteGitRepository,
  }),
}));

mock.module("@/router/router-auth-guard", () => ({
  routerAuthGuard: new Elysia({ name: "httpAuthGuard" }).resolve(
    { as: "scoped" },
    () => ({
      tenant: TENANT,
    }),
  ),
}));

const { gitRepositoryV1Router } =
  await import("@/router/git-repository/v1/router-git-repository-v1");

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
  mockCreateGitRepository.mockClear();
  mockGetGitRepository.mockClear();
  mockListGitRepositories.mockClear();
  mockUpdateGitRepository.mockClear();
  mockDeleteGitRepository.mockClear();
};

const app = gitRepositoryV1Router;

const request = (method: string, path: string, body?: unknown) => {
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return app.handle(new Request(`http://localhost${path}`, init));
};

// --- Tests ---

beforeEach(resetMocks);

test("POST /api/v1/git-repository: given a valid payload, when created successfully, then returns okEnvelope with id", async () => {
  // given
  const newId = "019606a0-0000-7000-8000-000000000099" as Id;
  mockCreateGitRepository.mockResolvedValue(ok({ id: newId }));

  // when
  const response = await request("POST", "/api/v1/git-repository", {
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
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(json.data).toEqual({ id: newId });
  expect(mockCreateGitRepository).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
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
});

test("POST /api/v1/git-repository: given a service failure, when called, then returns errEnvelope", async () => {
  // given
  mockCreateGitRepository.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request("POST", "/api/v1/git-repository", {
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
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});

test("GET /api/v1/git-repository: given repositories exist, when listed without filter, then returns repositories mapped to DTOs", async () => {
  // given
  const repos = [
    makeGitRepository(),
    makeGitRepository({
      name: "Second",
      id: "019606a0-0000-7000-8000-000000000002" as Id,
    }),
  ];
  mockListGitRepositories.mockResolvedValue(ok({ data: repos }));

  // when
  const response = await request("GET", "/api/v1/git-repository");
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.data).toHaveLength(2);
  expect(json.data[0].name).toBe("My Repo");
  expect(json.data[1].name).toBe("Second");
  expect(mockListGitRepositories).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    filter: undefined,
  });
});

test("GET /api/v1/git-repository: given a projectId query param, when listed, then passes projectId filter to service", async () => {
  // given
  mockListGitRepositories.mockResolvedValue(ok({ data: [] }));

  // when
  const response = await request(
    "GET",
    `/api/v1/git-repository?projectId=${PROJECT_ID}`,
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(mockListGitRepositories).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    filter: { projectId: PROJECT_ID },
  });
});

test("GET /api/v1/git-repository: given a service failure, when listed, then returns errEnvelope", async () => {
  // given
  mockListGitRepositories.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request("GET", "/api/v1/git-repository");
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});

test("GET /api/v1/git-repository/:id: given a repository exists, when fetched by id, then returns the repository mapped to DTO", async () => {
  // given
  const gitRepo = makeGitRepository();
  mockGetGitRepository.mockResolvedValue(ok({ data: gitRepo }));

  // when
  const response = await request("GET", `/api/v1/git-repository/${TEST_ID}`);
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.data.name).toBe("My Repo");
  expect(json.data.id).toBe(TEST_ID);
  expect(mockGetGitRepository).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: TEST_ID,
  });
});

test("GET /api/v1/git-repository/:id: given the repository does not exist, when fetched by id, then returns notFound errEnvelope", async () => {
  // given
  mockGetGitRepository.mockResolvedValue(err(Err.code("notFound")));

  // when
  const response = await request("GET", `/api/v1/git-repository/${TEST_ID}`);
  const json = await response.json();

  // then
  expect(json.status).toBe(404);
  expect(json.code).toBe("notFound");
});

test("PATCH /api/v1/git-repository/:id: given a valid update payload, when updated successfully, then returns okEnvelope", async () => {
  // given
  const updated = makeGitRepository({ name: "Updated", _version: 2 });
  mockUpdateGitRepository.mockResolvedValue(ok({ data: updated }));

  // when
  const response = await request(
    "PATCH",
    `/api/v1/git-repository/${TEST_ID}`,
    { name: "Updated" },
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(mockUpdateGitRepository).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: TEST_ID,
    data: { name: "Updated" },
  });
});

test("PATCH /api/v1/git-repository/:id: given a service failure, when updated, then returns errEnvelope", async () => {
  // given
  mockUpdateGitRepository.mockResolvedValue(err(Err.code("notFound")));

  // when
  const response = await request(
    "PATCH",
    `/api/v1/git-repository/${TEST_ID}`,
    { name: "Updated" },
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(404);
  expect(json.code).toBe("notFound");
});

test("DELETE /api/v1/git-repository/:id: given the repository exists, when deleted successfully, then returns okEnvelope", async () => {
  // given
  mockDeleteGitRepository.mockResolvedValue(ok());

  // when
  const response = await request(
    "DELETE",
    `/api/v1/git-repository/${TEST_ID}`,
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(mockDeleteGitRepository).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: TEST_ID,
  });
});

test("DELETE /api/v1/git-repository/:id: given a service failure, when deleted, then returns errEnvelope", async () => {
  // given
  mockDeleteGitRepository.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request(
    "DELETE",
    `/api/v1/git-repository/${TEST_ID}`,
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});
