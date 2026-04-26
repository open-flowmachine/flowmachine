import { afterAll, beforeEach, expect, mock, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

import * as workflowDefinitionServiceModule from "@/module/workflow/workflow-definition-service";
import { Err } from "@/shared/err/err";
import { betterAuthClient } from "@/vendor/better-auth/better-auth-client";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const TENANT: Tenant = { id: TEST_ID, type: "organization" };

const mockCreateWorkflowDefinition = mock();
const mockGetWorkflowDefinition = mock();
const mockListWorkflowDefinitions = mock();
const mockUpdateWorkflowDefinition = mock();
const mockDeleteWorkflowDefinition = mock();

const mockService = {
  create: mockCreateWorkflowDefinition,
  get: mockGetWorkflowDefinition,
  list: mockListWorkflowDefinitions,
  update: mockUpdateWorkflowDefinition,
  delete: mockDeleteWorkflowDefinition,
};

const makeServiceSpy = spyOn(
  workflowDefinitionServiceModule,
  "makeWorkflowDefinitionService",
).mockReturnValue(
  mockService as unknown as ReturnType<
    typeof workflowDefinitionServiceModule.makeWorkflowDefinitionService
  >,
);

const getSessionSpy = spyOn(
  betterAuthClient.api,
  "getSession",
).mockResolvedValue({
  session: { userId: TEST_ID, activeOrganizationId: TENANT.id },
  user: { id: TEST_ID },
} as never);

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
  mockCreateWorkflowDefinition.mockReset();
  mockGetWorkflowDefinition.mockReset();
  mockListWorkflowDefinitions.mockReset();
  mockUpdateWorkflowDefinition.mockReset();
  mockDeleteWorkflowDefinition.mockReset();
  getSessionSpy.mockReset();
  getSessionSpy.mockResolvedValue({
    session: { userId: TEST_ID, activeOrganizationId: TENANT.id },
    user: { id: TEST_ID },
  } as never);
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

beforeEach(resetMocks);

afterAll(() => {
  makeServiceSpy.mockRestore();
  getSessionSpy.mockRestore();
});

test("POST /api/v1/workflow-definition: given a valid payload, when created successfully, then returns okEnvelope with id", async () => {
  // given
  const newId = "019606a0-0000-7000-8000-000000000099" as Id;
  mockCreateWorkflowDefinition.mockResolvedValue(ok({ id: newId }));

  // when
  const response = await request("POST", "/api/v1/workflow-definition", {
    name: "New Workflow",
    projects: [],
    actions: [],
    edges: [],
    isActive: true,
  });
  const json = await response.json();

  // then
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

test("POST /api/v1/workflow-definition: given a service failure, when called, then returns errEnvelope", async () => {
  // given
  mockCreateWorkflowDefinition.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request("POST", "/api/v1/workflow-definition", {
    name: "New Workflow",
    projects: [],
    actions: [],
    edges: [],
    isActive: true,
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});

test("GET /api/v1/workflow-definition: given definitions exist, when listed, then returns definitions mapped to DTOs", async () => {
  // given
  const definitions = [
    makeWorkflowDefinition(),
    makeWorkflowDefinition({
      name: "Second",
      id: "019606a0-0000-7000-8000-000000000002" as Id,
    }),
  ];
  mockListWorkflowDefinitions.mockResolvedValue(ok({ data: definitions }));

  // when
  const response = await request("GET", "/api/v1/workflow-definition");
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.data).toHaveLength(2);
  expect(json.data[0].name).toBe("My Workflow");
  expect(json.data[1].name).toBe("Second");
  expect(mockListWorkflowDefinitions).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
  });
});

test("GET /api/v1/workflow-definition: given a service failure, when listed, then returns errEnvelope", async () => {
  // given
  mockListWorkflowDefinitions.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request("GET", "/api/v1/workflow-definition");
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});

test("GET /api/v1/workflow-definition/:id: given a definition exists, when fetched by id, then returns the definition mapped to DTO", async () => {
  // given
  const definition = makeWorkflowDefinition();
  mockGetWorkflowDefinition.mockResolvedValue(ok({ data: definition }));

  // when
  const response = await request(
    "GET",
    `/api/v1/workflow-definition/${TEST_ID}`,
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.data.name).toBe("My Workflow");
  expect(json.data.id).toBe(TEST_ID);
  expect(mockGetWorkflowDefinition).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: TEST_ID,
  });
});

test("GET /api/v1/workflow-definition/:id: given the definition does not exist, when fetched by id, then returns notFound errEnvelope", async () => {
  // given
  mockGetWorkflowDefinition.mockResolvedValue(err(Err.code("notFound")));

  // when
  const response = await request(
    "GET",
    `/api/v1/workflow-definition/${TEST_ID}`,
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(404);
  expect(json.code).toBe("notFound");
});

test("PATCH /api/v1/workflow-definition/:id: given a valid update payload, when updated successfully, then returns okEnvelope", async () => {
  // given
  const updated = makeWorkflowDefinition({ name: "Updated", _version: 2 });
  mockUpdateWorkflowDefinition.mockResolvedValue(ok({ data: updated }));

  // when
  const response = await request(
    "PATCH",
    `/api/v1/workflow-definition/${TEST_ID}`,
    { name: "Updated" },
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(mockUpdateWorkflowDefinition).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: TEST_ID,
    data: { name: "Updated" },
  });
});

test("PATCH /api/v1/workflow-definition/:id: given a service failure, when updated, then returns errEnvelope", async () => {
  // given
  mockUpdateWorkflowDefinition.mockResolvedValue(err(Err.code("notFound")));

  // when
  const response = await request(
    "PATCH",
    `/api/v1/workflow-definition/${TEST_ID}`,
    { name: "Updated" },
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(404);
  expect(json.code).toBe("notFound");
});

test("DELETE /api/v1/workflow-definition/:id: given the definition exists, when deleted successfully, then returns okEnvelope", async () => {
  // given
  mockDeleteWorkflowDefinition.mockResolvedValue(ok());

  // when
  const response = await request(
    "DELETE",
    `/api/v1/workflow-definition/${TEST_ID}`,
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(mockDeleteWorkflowDefinition).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: TEST_ID,
  });
});

test("DELETE /api/v1/workflow-definition/:id: given a service failure, when deleted, then returns errEnvelope", async () => {
  // given
  mockDeleteWorkflowDefinition.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request(
    "DELETE",
    `/api/v1/workflow-definition/${TEST_ID}`,
  );
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});
