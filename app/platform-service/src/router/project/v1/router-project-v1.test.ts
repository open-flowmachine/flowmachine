import { afterAll, beforeEach, expect, mock, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { Project } from "@/module/project/project-model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

import * as projectServiceModule from "@/module/project/project-service";
import { Err } from "@/shared/err/err";
import { betterAuthClient } from "@/vendor/better-auth/better-auth-client";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const TENANT: Tenant = { id: TEST_ID, type: "organization" };

const mockCreateProject = mock();
const mockGetProject = mock();
const mockListProjects = mock();
const mockUpdateProject = mock();
const mockDeleteProject = mock();

const mockService = {
  create: mockCreateProject,
  get: mockGetProject,
  list: mockListProjects,
  update: mockUpdateProject,
  delete: mockDeleteProject,
};

const makeServiceSpy = spyOn(
  projectServiceModule,
  "makeProjectService",
).mockReturnValue(
  mockService as unknown as ReturnType<
    typeof projectServiceModule.makeProjectService
  >,
);

const getSessionSpy = spyOn(
  betterAuthClient.api,
  "getSession",
).mockResolvedValue({
  session: { userId: TEST_ID, activeOrganizationId: TENANT.id },
  user: { id: TEST_ID },
} as never);

const { projectV1Router } = await import(
  "@/router/project/v1/router-project-v1"
);

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
  mockCreateProject.mockReset();
  mockGetProject.mockReset();
  mockListProjects.mockReset();
  mockUpdateProject.mockReset();
  mockDeleteProject.mockReset();
  getSessionSpy.mockReset();
  getSessionSpy.mockResolvedValue({
    session: { userId: TEST_ID, activeOrganizationId: TENANT.id },
    user: { id: TEST_ID },
  } as never);
};

const app = projectV1Router;

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

afterAll(() => {
  makeServiceSpy.mockRestore();
  getSessionSpy.mockRestore();
});

test("POST /api/v1/project: given a valid payload, when created successfully, then returns okEnvelope with id", async () => {
  // given
  const newId = "019606a0-0000-7000-8000-000000000099" as Id;
  mockCreateProject.mockResolvedValue(ok({ id: newId }));

  // when
  const response = await request("POST", "/api/v1/project", {
    name: "New Project",
    integration: null,
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(json.data).toEqual({ id: newId });
  expect(mockCreateProject).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    payload: { name: "New Project", integration: null },
  });
});

test("POST /api/v1/project: given a service failure, when called, then returns errEnvelope", async () => {
  // given
  mockCreateProject.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request("POST", "/api/v1/project", {
    name: "New Project",
    integration: null,
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});

test("GET /api/v1/project: given projects exist, when listed, then returns projects mapped to DTOs", async () => {
  // given
  const projects = [
    makeProject(),
    makeProject({
      name: "Second",
      id: "019606a0-0000-7000-8000-000000000002" as Id,
    }),
  ];
  mockListProjects.mockResolvedValue(ok({ data: projects }));

  // when
  const response = await request("GET", "/api/v1/project");
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.data).toHaveLength(2);
  expect(json.data[0].name).toBe("My Project");
  expect(json.data[1].name).toBe("Second");
  expect(mockListProjects).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
  });
});

test("GET /api/v1/project: given a service failure, when listed, then returns errEnvelope", async () => {
  // given
  mockListProjects.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request("GET", "/api/v1/project");
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});

test("GET /api/v1/project/:id: given a project exists, when fetched by id, then returns the project mapped to DTO", async () => {
  // given
  const project = makeProject();
  mockGetProject.mockResolvedValue(ok({ data: project }));

  // when
  const response = await request("GET", `/api/v1/project/${TEST_ID}`);
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.data.name).toBe("My Project");
  expect(json.data.id).toBe(TEST_ID);
  expect(mockGetProject).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: TEST_ID,
  });
});

test("GET /api/v1/project/:id: given the project does not exist, when fetched by id, then returns notFound errEnvelope", async () => {
  // given
  mockGetProject.mockResolvedValue(err(Err.code("notFound")));

  // when
  const response = await request("GET", `/api/v1/project/${TEST_ID}`);
  const json = await response.json();

  // then
  expect(json.status).toBe(404);
  expect(json.code).toBe("notFound");
});

test("PATCH /api/v1/project/:id: given a valid update payload, when updated successfully, then returns okEnvelope", async () => {
  // given
  const updated = makeProject({ name: "Updated", _version: 2 });
  mockUpdateProject.mockResolvedValue(ok({ data: updated }));

  // when
  const response = await request("PATCH", `/api/v1/project/${TEST_ID}`, {
    name: "Updated",
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(mockUpdateProject).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: TEST_ID,
    data: { name: "Updated" },
  });
});

test("PATCH /api/v1/project/:id: given a service failure, when updated, then returns errEnvelope", async () => {
  // given
  mockUpdateProject.mockResolvedValue(err(Err.code("notFound")));

  // when
  const response = await request("PATCH", `/api/v1/project/${TEST_ID}`, {
    name: "Updated",
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(404);
  expect(json.code).toBe("notFound");
});

test("DELETE /api/v1/project/:id: given the project exists, when deleted successfully, then returns okEnvelope", async () => {
  // given
  mockDeleteProject.mockResolvedValue(ok());

  // when
  const response = await request("DELETE", `/api/v1/project/${TEST_ID}`);
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(mockDeleteProject).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: TEST_ID,
  });
});

test("DELETE /api/v1/project/:id: given a service failure, when deleted, then returns errEnvelope", async () => {
  // given
  mockDeleteProject.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request("DELETE", `/api/v1/project/${TEST_ID}`);
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});
