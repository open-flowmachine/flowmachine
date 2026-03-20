import { beforeEach, describe, expect, it, mock } from "bun:test";
import Elysia from "elysia";
import { err, ok } from "neverthrow";
import type { Credential } from "@/module/credential/credential-model";
import { Err } from "@/shared/err/err";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

// --- Mock setup ---

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;
const TENANT: Tenant = { id: TEST_ID, type: "organization" };

const mockCreateCredential = mock();
const mockGetCredential = mock();
const mockListCredentials = mock();
const mockUpdateCredential = mock();
const mockDeleteCredential = mock();

mock.module("@/module/credential/credential-service", () => ({
  createCredential: mockCreateCredential,
  getCredential: mockGetCredential,
  listCredentials: mockListCredentials,
  updateCredential: mockUpdateCredential,
  deleteCredential: mockDeleteCredential,
}));

mock.module("@/router/router-auth-guard", () => ({
  routerAuthGuard: new Elysia({ name: "httpAuthGuard" }).resolve(
    { as: "scoped" },
    () => ({
      tenant: TENANT,
    }),
  ),
}));

const { credentialV1Router } = await import(
  "@/router/credential/v1/router-credential-v1"
);

// --- Helpers ---

const now = new Date("2026-01-01");
const expiredAt = new Date("2027-01-01");

const makeApiKeyCredential = (
  overrides?: Partial<Credential>,
): Credential => ({
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
  overrides?: Partial<Credential>,
): Credential => ({
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
  mockCreateCredential.mockClear();
  mockGetCredential.mockClear();
  mockListCredentials.mockClear();
  mockUpdateCredential.mockClear();
  mockDeleteCredential.mockClear();
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

describe("POST /api/v1/credential", () => {
  beforeEach(resetMocks);

  it("should return okEnvelope with id on success for apiKey type", async () => {
    const newId = "019606a0-0000-7000-8000-000000000099" as Id;
    mockCreateCredential.mockResolvedValue(ok({ id: newId }));

    const response = await request("POST", "/api/v1/credential", {
      type: "apiKey",
      name: "New Key",
      apiKey: "sk-new-123",
      expiredAt: "2027-01-01T00:00:00.000Z",
    });
    const json = await response.json();

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

  it("should return okEnvelope with id on success for basic type", async () => {
    const newId = "019606a0-0000-7000-8000-000000000099" as Id;
    mockCreateCredential.mockResolvedValue(ok({ id: newId }));

    const response = await request("POST", "/api/v1/credential", {
      type: "basic",
      name: "New Basic",
      username: "user",
      password: "pass",
      expiredAt: "2027-01-01T00:00:00.000Z",
    });
    const json = await response.json();

    expect(json.status).toBe(200);
    expect(json.code).toBe("ok");
    expect(json.data).toEqual({ id: newId });
  });

  it("should return errEnvelope on service error", async () => {
    mockCreateCredential.mockResolvedValue(err(Err.code("unknown")));

    const response = await request("POST", "/api/v1/credential", {
      type: "apiKey",
      name: "New Key",
      apiKey: "sk-new-123",
      expiredAt: "2027-01-01T00:00:00.000Z",
    });
    const json = await response.json();

    expect(json.status).toBe(500);
    expect(json.code).toBe("unknown");
  });
});

describe("GET /api/v1/credential", () => {
  beforeEach(resetMocks);

  it("should return list of credentials mapped to DTOs", async () => {
    const credentials = [
      makeApiKeyCredential(),
      makeBasicCredential({
        id: "019606a0-0000-7000-8000-000000000002" as Id,
      }),
    ];
    mockListCredentials.mockResolvedValue(ok({ data: credentials }));

    const response = await request("GET", "/api/v1/credential");
    const json = await response.json();

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

  it("should return errEnvelope on service error", async () => {
    mockListCredentials.mockResolvedValue(err(Err.code("unknown")));

    const response = await request("GET", "/api/v1/credential");
    const json = await response.json();

    expect(json.status).toBe(500);
    expect(json.code).toBe("unknown");
  });
});

describe("GET /api/v1/credential/:id", () => {
  beforeEach(resetMocks);

  it("should return single apiKey credential mapped to DTO", async () => {
    const credential = makeApiKeyCredential();
    mockGetCredential.mockResolvedValue(ok({ data: credential }));

    const response = await request("GET", `/api/v1/credential/${TEST_ID}`);
    const json = await response.json();

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

  it("should return single basic credential mapped to DTO", async () => {
    const credential = makeBasicCredential();
    mockGetCredential.mockResolvedValue(ok({ data: credential }));

    const response = await request("GET", `/api/v1/credential/${TEST_ID}`);
    const json = await response.json();

    expect(json.status).toBe(200);
    expect(json.data.type).toBe("basic");
    expect(json.data.username).toBe("admin");
    expect(json.data.password).toBe("secret");
  });

  it("should return errEnvelope when not found", async () => {
    mockGetCredential.mockResolvedValue(err(Err.code("notFound")));

    const response = await request("GET", `/api/v1/credential/${TEST_ID}`);
    const json = await response.json();

    expect(json.status).toBe(404);
    expect(json.code).toBe("notFound");
  });
});

describe("PATCH /api/v1/credential/:id", () => {
  beforeEach(resetMocks);

  it("should return okEnvelope on success", async () => {
    const updated = makeApiKeyCredential({
      name: "Updated Key",
      _version: 2,
    });
    mockUpdateCredential.mockResolvedValue(ok({ data: updated }));

    const response = await request("PATCH", `/api/v1/credential/${TEST_ID}`, {
      type: "apiKey",
      name: "Updated Key",
    });
    const json = await response.json();

    expect(json.status).toBe(200);
    expect(json.code).toBe("ok");
    expect(mockUpdateCredential).toHaveBeenCalledWith({
      ctx: { tenant: TENANT },
      id: TEST_ID,
      data: { type: "apiKey", name: "Updated Key" },
    });
  });

  it("should return errEnvelope on service error", async () => {
    mockUpdateCredential.mockResolvedValue(err(Err.code("notFound")));

    const response = await request("PATCH", `/api/v1/credential/${TEST_ID}`, {
      type: "apiKey",
      name: "Updated",
    });
    const json = await response.json();

    expect(json.status).toBe(404);
    expect(json.code).toBe("notFound");
  });
});

describe("DELETE /api/v1/credential/:id", () => {
  beforeEach(resetMocks);

  it("should return okEnvelope on success", async () => {
    mockDeleteCredential.mockResolvedValue(ok());

    const response = await request("DELETE", `/api/v1/credential/${TEST_ID}`);
    const json = await response.json();

    expect(json.status).toBe(200);
    expect(json.code).toBe("ok");
    expect(mockDeleteCredential).toHaveBeenCalledWith({
      ctx: { tenant: TENANT },
      id: TEST_ID,
    });
  });

  it("should return errEnvelope on service error", async () => {
    mockDeleteCredential.mockResolvedValue(err(Err.code("unknown")));

    const response = await request("DELETE", `/api/v1/credential/${TEST_ID}`);
    const json = await response.json();

    expect(json.status).toBe(500);
    expect(json.code).toBe("unknown");
  });
});
