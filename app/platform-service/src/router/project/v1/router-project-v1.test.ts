import { beforeEach, describe, expect, it, mock } from "bun:test";
import Elysia from "elysia";
import { err, ok } from "neverthrow";
import type { Project } from "@/module/project/project-model";
import { Err } from "@/shared/err/err";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const TENANT: Tenant = { id: TEST_ID, type: "organization" };

const mockCreateProject = mock();
const mockGetProject = mock();
const mockListProjects = mock();
const mockUpdateProject = mock();
const mockDeleteProject = mock();

mock.module("@/module/project/project-service", () => ({
  makeProjectService: () => ({
    create: mockCreateProject,
    get: mockGetProject,
    list: mockListProjects,
    update: mockUpdateProject,
    delete: mockDeleteProject,
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

const { projectV1Router } =
  await import("@/router/project/v1/router-project-v1");

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
  mockCreateProject.mockClear();
  mockGetProject.mockClear();
  mockListProjects.mockClear();
  mockUpdateProject.mockClear();
  mockDeleteProject.mockClear();
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

describe("POST /api/v1/project", () => {
  beforeEach(resetMocks);

  it("should return okEnvelope with id on success", async () => {
    const newId = "019606a0-0000-7000-8000-000000000099" as Id;
    mockCreateProject.mockResolvedValue(ok({ id: newId }));

    const response = await request("POST", "/api/v1/project", {
      name: "New Project",
      integration: null,
    });
    const json = await response.json();

    expect(json.status).toBe(200);
    expect(json.code).toBe("ok");
    expect(json.data).toEqual({ id: newId });
    expect(mockCreateProject).toHaveBeenCalledWith({
      ctx: { tenant: TENANT },
      payload: { name: "New Project", integration: null },
    });
  });

  it("should return errEnvelope on service error", async () => {
    mockCreateProject.mockResolvedValue(err(Err.code("unknown")));

    const response = await request("POST", "/api/v1/project", {
      name: "New Project",
      integration: null,
    });
    const json = await response.json();

    expect(json.status).toBe(500);
    expect(json.code).toBe("unknown");
  });
});

describe("GET /api/v1/project", () => {
  beforeEach(resetMocks);

  it("should return list of projects mapped to DTOs", async () => {
    const projects = [
      makeProject(),
      makeProject({
        name: "Second",
        id: "019606a0-0000-7000-8000-000000000002" as Id,
      }),
    ];
    mockListProjects.mockResolvedValue(ok({ data: projects }));

    const response = await request("GET", "/api/v1/project");
    const json = await response.json();

    expect(json.status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].name).toBe("My Project");
    expect(json.data[1].name).toBe("Second");
    expect(mockListProjects).toHaveBeenCalledWith({
      ctx: { tenant: TENANT },
    });
  });

  it("should return errEnvelope on service error", async () => {
    mockListProjects.mockResolvedValue(err(Err.code("unknown")));

    const response = await request("GET", "/api/v1/project");
    const json = await response.json();

    expect(json.status).toBe(500);
    expect(json.code).toBe("unknown");
  });
});

describe("GET /api/v1/project/:id", () => {
  beforeEach(resetMocks);

  it("should return single project mapped to DTO", async () => {
    const project = makeProject();
    mockGetProject.mockResolvedValue(ok({ data: project }));

    const response = await request("GET", `/api/v1/project/${TEST_ID}`);
    const json = await response.json();

    expect(json.status).toBe(200);
    expect(json.data.name).toBe("My Project");
    expect(json.data.id).toBe(TEST_ID);
    expect(mockGetProject).toHaveBeenCalledWith({
      ctx: { tenant: TENANT },
      id: TEST_ID,
    });
  });

  it("should return errEnvelope when not found", async () => {
    mockGetProject.mockResolvedValue(err(Err.code("notFound")));

    const response = await request("GET", `/api/v1/project/${TEST_ID}`);
    const json = await response.json();

    expect(json.status).toBe(404);
    expect(json.code).toBe("notFound");
  });
});

describe("PATCH /api/v1/project/:id", () => {
  beforeEach(resetMocks);

  it("should return okEnvelope on success", async () => {
    const updated = makeProject({ name: "Updated", _version: 2 });
    mockUpdateProject.mockResolvedValue(ok({ data: updated }));

    const response = await request("PATCH", `/api/v1/project/${TEST_ID}`, {
      name: "Updated",
    });
    const json = await response.json();

    expect(json.status).toBe(200);
    expect(json.code).toBe("ok");
    expect(mockUpdateProject).toHaveBeenCalledWith({
      ctx: { tenant: TENANT },
      id: TEST_ID,
      data: { name: "Updated" },
    });
  });

  it("should return errEnvelope on service error", async () => {
    mockUpdateProject.mockResolvedValue(err(Err.code("notFound")));

    const response = await request("PATCH", `/api/v1/project/${TEST_ID}`, {
      name: "Updated",
    });
    const json = await response.json();

    expect(json.status).toBe(404);
    expect(json.code).toBe("notFound");
  });
});

describe("DELETE /api/v1/project/:id", () => {
  beforeEach(resetMocks);

  it("should return okEnvelope on success", async () => {
    mockDeleteProject.mockResolvedValue(ok());

    const response = await request("DELETE", `/api/v1/project/${TEST_ID}`);
    const json = await response.json();

    expect(json.status).toBe(200);
    expect(json.code).toBe("ok");
    expect(mockDeleteProject).toHaveBeenCalledWith({
      ctx: { tenant: TENANT },
      id: TEST_ID,
    });
  });

  it("should return errEnvelope on service error", async () => {
    mockDeleteProject.mockResolvedValue(err(Err.code("unknown")));

    const response = await request("DELETE", `/api/v1/project/${TEST_ID}`);
    const json = await response.json();

    expect(json.status).toBe(500);
    expect(json.code).toBe("unknown");
  });
});
