import { beforeEach, describe, expect, it, mock } from "bun:test";
import Elysia from "elysia";
import { err, ok } from "neverthrow";
import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-model";
import { Err } from "@/shared/err/err";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const TENANT: Tenant = { id: TEST_ID, type: "organization" };

const mockCreateWorkflowDefinition = mock();
const mockGetWorkflowDefinition = mock();
const mockListWorkflowDefinitions = mock();
const mockUpdateWorkflowDefinition = mock();
const mockDeleteWorkflowDefinition = mock();

mock.module("@/module/workflow/workflow-definition-service", () => ({
  makeWorkflowDefinitionService: () => ({
    create: mockCreateWorkflowDefinition,
    get: mockGetWorkflowDefinition,
    list: mockListWorkflowDefinitions,
    update: mockUpdateWorkflowDefinition,
    delete: mockDeleteWorkflowDefinition,
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

const { workflowDefinitionV1Router } = await import(
  "@/router/workflow/v1/router-workflow-definition-v1"
);

// --- Helpers ---

const now = new Date("2026-01-01");

const makeWorkflowDefinition = (
  overrides?: Partial<WorkflowDefinition>,
): WorkflowDefinition => ({
  id: TEST_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  name: "My Workflow",
  description: "A test workflow",
  projects: [],
  actions: [{ id: "action-1", kind: "research", name: "Research" }],
  edges: [],
  isActive: true,
  ...overrides,
});

const resetMocks = () => {
  mockCreateWorkflowDefinition.mockClear();
  mockGetWorkflowDefinition.mockClear();
  mockListWorkflowDefinitions.mockClear();
  mockUpdateWorkflowDefinition.mockClear();
  mockDeleteWorkflowDefinition.mockClear();
};

const app = workflowDefinitionV1Router;

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

describe("POST /api/v1/workflow-definition", () => {
  beforeEach(resetMocks);

  it("should return okEnvelope with id on success", async () => {
    const newId = "019606a0-0000-7000-8000-000000000099" as Id;
    mockCreateWorkflowDefinition.mockResolvedValue(ok({ id: newId }));

    const response = await request("POST", "/api/v1/workflow-definition", {
      name: "New Workflow",
      projects: [],
      actions: [],
      edges: [],
      isActive: true,
    });
    const json = await response.json();

    expect(json.status).toBe(200);
    expect(json.code).toBe("ok");
    expect(json.data).toEqual({ id: newId });
    expect(mockCreateWorkflowDefinition).toHaveBeenCalledWith({
      ctx: { tenant: TENANT },
      payload: {
        name: "New Workflow",
        projects: [],
        actions: [],
        edges: [],
        isActive: true,
      },
    });
  });

  it("should return errEnvelope on service error", async () => {
    mockCreateWorkflowDefinition.mockResolvedValue(err(Err.code("unknown")));

    const response = await request("POST", "/api/v1/workflow-definition", {
      name: "New Workflow",
      projects: [],
      actions: [],
      edges: [],
      isActive: true,
    });
    const json = await response.json();

    expect(json.status).toBe(500);
    expect(json.code).toBe("unknown");
  });
});

describe("GET /api/v1/workflow-definition", () => {
  beforeEach(resetMocks);

  it("should return list of workflow definitions mapped to DTOs", async () => {
    const definitions = [
      makeWorkflowDefinition(),
      makeWorkflowDefinition({
        name: "Second",
        id: "019606a0-0000-7000-8000-000000000002" as Id,
      }),
    ];
    mockListWorkflowDefinitions.mockResolvedValue(ok({ data: definitions }));

    const response = await request("GET", "/api/v1/workflow-definition");
    const json = await response.json();

    expect(json.status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].name).toBe("My Workflow");
    expect(json.data[1].name).toBe("Second");
    expect(mockListWorkflowDefinitions).toHaveBeenCalledWith({
      ctx: { tenant: TENANT },
    });
  });

  it("should return errEnvelope on service error", async () => {
    mockListWorkflowDefinitions.mockResolvedValue(err(Err.code("unknown")));

    const response = await request("GET", "/api/v1/workflow-definition");
    const json = await response.json();

    expect(json.status).toBe(500);
    expect(json.code).toBe("unknown");
  });
});

describe("GET /api/v1/workflow-definition/:id", () => {
  beforeEach(resetMocks);

  it("should return single workflow definition mapped to DTO", async () => {
    const definition = makeWorkflowDefinition();
    mockGetWorkflowDefinition.mockResolvedValue(ok({ data: definition }));

    const response = await request(
      "GET",
      `/api/v1/workflow-definition/${TEST_ID}`,
    );
    const json = await response.json();

    expect(json.status).toBe(200);
    expect(json.data.name).toBe("My Workflow");
    expect(json.data.id).toBe(TEST_ID);
    expect(mockGetWorkflowDefinition).toHaveBeenCalledWith({
      ctx: { tenant: TENANT },
      id: TEST_ID,
    });
  });

  it("should return errEnvelope when not found", async () => {
    mockGetWorkflowDefinition.mockResolvedValue(err(Err.code("notFound")));

    const response = await request(
      "GET",
      `/api/v1/workflow-definition/${TEST_ID}`,
    );
    const json = await response.json();

    expect(json.status).toBe(404);
    expect(json.code).toBe("notFound");
  });
});

describe("PATCH /api/v1/workflow-definition/:id", () => {
  beforeEach(resetMocks);

  it("should return okEnvelope on success", async () => {
    const updated = makeWorkflowDefinition({ name: "Updated", _version: 2 });
    mockUpdateWorkflowDefinition.mockResolvedValue(ok({ data: updated }));

    const response = await request(
      "PATCH",
      `/api/v1/workflow-definition/${TEST_ID}`,
      { name: "Updated" },
    );
    const json = await response.json();

    expect(json.status).toBe(200);
    expect(json.code).toBe("ok");
    expect(mockUpdateWorkflowDefinition).toHaveBeenCalledWith({
      ctx: { tenant: TENANT },
      id: TEST_ID,
      data: { name: "Updated" },
    });
  });

  it("should return errEnvelope on service error", async () => {
    mockUpdateWorkflowDefinition.mockResolvedValue(err(Err.code("notFound")));

    const response = await request(
      "PATCH",
      `/api/v1/workflow-definition/${TEST_ID}`,
      { name: "Updated" },
    );
    const json = await response.json();

    expect(json.status).toBe(404);
    expect(json.code).toBe("notFound");
  });
});

describe("DELETE /api/v1/workflow-definition/:id", () => {
  beforeEach(resetMocks);

  it("should return okEnvelope on success", async () => {
    mockDeleteWorkflowDefinition.mockResolvedValue(ok());

    const response = await request(
      "DELETE",
      `/api/v1/workflow-definition/${TEST_ID}`,
    );
    const json = await response.json();

    expect(json.status).toBe(200);
    expect(json.code).toBe("ok");
    expect(mockDeleteWorkflowDefinition).toHaveBeenCalledWith({
      ctx: { tenant: TENANT },
      id: TEST_ID,
    });
  });

  it("should return errEnvelope on service error", async () => {
    mockDeleteWorkflowDefinition.mockResolvedValue(err(Err.code("unknown")));

    const response = await request(
      "DELETE",
      `/api/v1/workflow-definition/${TEST_ID}`,
    );
    const json = await response.json();

    expect(json.status).toBe(500);
    expect(json.code).toBe("unknown");
  });
});
