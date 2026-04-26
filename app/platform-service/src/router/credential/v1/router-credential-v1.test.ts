import { afterAll, beforeEach, expect, mock, spyOn, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { Credential } from "@/module/credential/credential-model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

import * as credentialServiceModule from "@/module/credential/credential-service";
import { Err } from "@/shared/err/err";
import { betterAuthClient } from "@/vendor/better-auth/better-auth-client";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const TENANT: Tenant = { id: TEST_ID, type: "organization" };

const mockCreateCredential = mock();
const mockGetCredential = mock();
const mockListCredentials = mock();
const mockUpdateCredential = mock();
const mockDeleteCredential = mock();

const mockService = {
  create: mockCreateCredential,
  get: mockGetCredential,
  list: mockListCredentials,
  update: mockUpdateCredential,
  delete: mockDeleteCredential,
};

const makeServiceSpy = spyOn(
  credentialServiceModule,
  "makeCredentialService",
).mockReturnValue(
  mockService as unknown as ReturnType<
    typeof credentialServiceModule.makeCredentialService
  >,
);

const getSessionSpy = spyOn(
  betterAuthClient.api,
  "getSession",
).mockResolvedValue({
  session: { userId: TEST_ID, activeOrganizationId: TENANT.id },
  user: { id: TEST_ID },
} as never);

const { credentialV1Router } = await import(
  "@/router/credential/v1/router-credential-v1"
);

// --- Helpers ---

const now = new Date("2026-01-01");
const expiredAt = new Date("2027-01-01");

type ApiKeyCredential = Extract<Credential, { type: "apiKey" }>;
type BasicCredential = Extract<Credential, { type: "basic" }>;

const makeApiKeyCredential = (
  overrides?: Partial<Omit<ApiKeyCredential, "type">>,
): ApiKeyCredential => ({
  id: TEST_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  type: "apiKey",
  name: "My API Key",
  apiKey: "sk-test-123",
  expiredAt,
  ...overrides,
});

const makeBasicCredential = (
  overrides?: Partial<Omit<BasicCredential, "type">>,
): BasicCredential => ({
  id: TEST_ID,
  _version: 1,
  createdAt: now,
  updatedAt: now,
  type: "basic",
  name: "My Basic Credential",
  username: "admin",
  password: "secret",
  expiredAt,
  ...overrides,
});

const resetMocks = () => {
  mockCreateCredential.mockReset();
  mockGetCredential.mockReset();
  mockListCredentials.mockReset();
  mockUpdateCredential.mockReset();
  mockDeleteCredential.mockReset();
  getSessionSpy.mockReset();
  getSessionSpy.mockResolvedValue({
    session: { userId: TEST_ID, activeOrganizationId: TENANT.id },
    user: { id: TEST_ID },
  } as never);
};

const app = credentialV1Router;

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

test("POST /api/v1/credential: given a valid apiKey payload, when created successfully, then returns okEnvelope with id", async () => {
  // given
  const newId = "019606a0-0000-7000-8000-000000000099" as Id;
  mockCreateCredential.mockResolvedValue(ok({ id: newId }));

  // when
  const response = await request("POST", "/api/v1/credential", {
    type: "apiKey",
    name: "New Key",
    apiKey: "sk-new-123",
    expiredAt: "2027-01-01T00:00:00.000Z",
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(json.data).toEqual({ id: newId });
  expect(mockCreateCredential).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    payload: expect.objectContaining({
      type: "apiKey",
      name: "New Key",
      apiKey: "sk-new-123",
    }),
  });
});

test("POST /api/v1/credential: given a valid basic payload, when created successfully, then returns okEnvelope with id", async () => {
  // given
  const newId = "019606a0-0000-7000-8000-000000000099" as Id;
  mockCreateCredential.mockResolvedValue(ok({ id: newId }));

  // when
  const response = await request("POST", "/api/v1/credential", {
    type: "basic",
    name: "New Basic",
    username: "user",
    password: "pass",
    expiredAt: "2027-01-01T00:00:00.000Z",
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(json.data).toEqual({ id: newId });
});

test("POST /api/v1/credential: given a service failure, when called, then returns errEnvelope", async () => {
  // given
  mockCreateCredential.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request("POST", "/api/v1/credential", {
    type: "apiKey",
    name: "New Key",
    apiKey: "sk-new-123",
    expiredAt: "2027-01-01T00:00:00.000Z",
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});

test("GET /api/v1/credential: given credentials exist, when listed, then returns credentials mapped to DTOs", async () => {
  // given
  const credentials = [
    makeApiKeyCredential(),
    makeBasicCredential({
      id: "019606a0-0000-7000-8000-000000000002" as Id,
    }),
  ];
  mockListCredentials.mockResolvedValue(ok({ data: credentials }));

  // when
  const response = await request("GET", "/api/v1/credential");
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.data).toHaveLength(2);
  expect(json.data[0].type).toBe("apiKey");
  expect(json.data[0].name).toBe("My API Key");
  expect(json.data[1].type).toBe("basic");
  expect(json.data[1].name).toBe("My Basic Credential");
  expect(mockListCredentials).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
  });
});

test("GET /api/v1/credential: given a service failure, when listed, then returns errEnvelope", async () => {
  // given
  mockListCredentials.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request("GET", "/api/v1/credential");
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});

test("GET /api/v1/credential/:id: given an apiKey credential exists, when fetched by id, then returns the credential mapped to DTO", async () => {
  // given
  const credential = makeApiKeyCredential();
  mockGetCredential.mockResolvedValue(ok({ data: credential }));

  // when
  const response = await request("GET", `/api/v1/credential/${TEST_ID}`);
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.data.type).toBe("apiKey");
  expect(json.data.name).toBe("My API Key");
  expect(json.data.apiKey).toBe("sk-test-123");
  expect(json.data.id).toBe(TEST_ID);
  expect(mockGetCredential).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: TEST_ID,
  });
});

test("GET /api/v1/credential/:id: given a basic credential exists, when fetched by id, then returns the credential mapped to DTO", async () => {
  // given
  const credential = makeBasicCredential();
  mockGetCredential.mockResolvedValue(ok({ data: credential }));

  // when
  const response = await request("GET", `/api/v1/credential/${TEST_ID}`);
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.data.type).toBe("basic");
  expect(json.data.username).toBe("admin");
  expect(json.data.password).toBe("secret");
});

test("GET /api/v1/credential/:id: given the credential does not exist, when fetched by id, then returns notFound errEnvelope", async () => {
  // given
  mockGetCredential.mockResolvedValue(err(Err.code("notFound")));

  // when
  const response = await request("GET", `/api/v1/credential/${TEST_ID}`);
  const json = await response.json();

  // then
  expect(json.status).toBe(404);
  expect(json.code).toBe("notFound");
});

test("PATCH /api/v1/credential/:id: given a valid update payload, when updated successfully, then returns okEnvelope", async () => {
  // given
  const updated = makeApiKeyCredential({
    name: "Updated Key",
    _version: 2,
  });
  mockUpdateCredential.mockResolvedValue(ok({ data: updated }));

  // when
  const response = await request("PATCH", `/api/v1/credential/${TEST_ID}`, {
    type: "apiKey",
    name: "Updated Key",
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(mockUpdateCredential).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: TEST_ID,
    data: { type: "apiKey", name: "Updated Key" },
  });
});

test("PATCH /api/v1/credential/:id: given a service failure, when updated, then returns errEnvelope", async () => {
  // given
  mockUpdateCredential.mockResolvedValue(err(Err.code("notFound")));

  // when
  const response = await request("PATCH", `/api/v1/credential/${TEST_ID}`, {
    type: "apiKey",
    name: "Updated",
  });
  const json = await response.json();

  // then
  expect(json.status).toBe(404);
  expect(json.code).toBe("notFound");
});

test("DELETE /api/v1/credential/:id: given the credential exists, when deleted successfully, then returns okEnvelope", async () => {
  // given
  mockDeleteCredential.mockResolvedValue(ok());

  // when
  const response = await request("DELETE", `/api/v1/credential/${TEST_ID}`);
  const json = await response.json();

  // then
  expect(json.status).toBe(200);
  expect(json.code).toBe("ok");
  expect(mockDeleteCredential).toHaveBeenCalledWith({
    ctx: { tenant: TENANT },
    id: TEST_ID,
  });
});

test("DELETE /api/v1/credential/:id: given a service failure, when deleted, then returns errEnvelope", async () => {
  // given
  mockDeleteCredential.mockResolvedValue(err(Err.code("unknown")));

  // when
  const response = await request("DELETE", `/api/v1/credential/${TEST_ID}`);
  const json = await response.json();

  // then
  expect(json.status).toBe(500);
  expect(json.code).toBe("unknown");
});
