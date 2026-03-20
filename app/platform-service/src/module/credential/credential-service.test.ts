import { beforeEach, describe, expect, it, mock } from "bun:test";
import { err, ok } from "neverthrow";
import type { Credential } from "@/module/credential/credential-model";
import { Err } from "@/shared/err/err";
import { type Id, idSchema } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

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

mock.module("@/module/credential/credential-repository", () => ({
  credentialRepository: mockRepository,
}));

mock.module("@/shared/model/model-id", () => ({
  idSchema,
  newId: () => NEW_ID,
}));

const {
  createCredential,
  getCredential,
  listCredentials,
  updateCredential,
  deleteCredential,
} = await import("./credential-service");

// --- Helpers ---

const now = new Date("2026-01-01");

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
  expiredAt: new Date("2027-01-01"),
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
  expiredAt: new Date("2027-01-01"),
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

describe("createCredential", () => {
  beforeEach(resetMocks);

  it("should insert a new apiKey credential with generated id and timestamps", async () => {
    mockRepository.insert.mockResolvedValue(ok());

    const result = await createCredential({
      ctx,
      payload: {
        type: "apiKey",
        name: "New Key",
        apiKey: "sk-new-123",
        expiredAt: new Date("2027-01-01"),
      },
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ id: NEW_ID });
    expect(mockRepository.insert).toHaveBeenCalledWith({
      ctx,
      data: expect.objectContaining({
        id: NEW_ID,
        _version: 1,
        type: "apiKey",
        name: "New Key",
        apiKey: "sk-new-123",
      }),
    });
  });

  it("should insert a new basic credential with generated id and timestamps", async () => {
    mockRepository.insert.mockResolvedValue(ok());

    const result = await createCredential({
      ctx,
      payload: {
        type: "basic",
        name: "New Basic",
        username: "user",
        password: "pass",
        expiredAt: new Date("2027-01-01"),
      },
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ id: NEW_ID });
    expect(mockRepository.insert).toHaveBeenCalledWith({
      ctx,
      data: expect.objectContaining({
        id: NEW_ID,
        _version: 1,
        type: "basic",
        name: "New Basic",
        username: "user",
        password: "pass",
      }),
    });
  });

  it("should return err when repository insert fails", async () => {
    mockRepository.insert.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await createCredential({
      ctx,
      payload: {
        type: "apiKey",
        name: "New Key",
        apiKey: "sk-new-123",
        expiredAt: new Date("2027-01-01"),
      },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("getCredential", () => {
  beforeEach(resetMocks);

  it("should return the credential when found", async () => {
    const credential = makeApiKeyCredential();
    mockRepository.findById.mockResolvedValue(ok({ data: credential }));

    const result = await getCredential({ ctx, id: TEST_ID });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: credential } as never);
    expect(mockRepository.findById).toHaveBeenCalledWith({ ctx, id: TEST_ID });
  });

  it("should return notFound err when credential does not exist", async () => {
    mockRepository.findById.mockResolvedValue(ok({ data: null }));

    const result = await getCredential({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
    expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
  });

  it("should return err when repository fails", async () => {
    mockRepository.findById.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await getCredential({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("listCredentials", () => {
  beforeEach(resetMocks);

  it("should return all credentials for the tenant", async () => {
    const credentials = [makeApiKeyCredential(), makeBasicCredential()];
    mockRepository.findMany.mockResolvedValue(ok({ data: credentials }));

    const result = await listCredentials({ ctx });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: credentials } as never);
    expect(mockRepository.findMany).toHaveBeenCalledWith({ ctx });
  });

  it("should return err when repository fails", async () => {
    mockRepository.findMany.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await listCredentials({ ctx });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("updateCredential", () => {
  beforeEach(resetMocks);

  it("should update the credential and return updated data", async () => {
    const existing = makeApiKeyCredential();
    const updated = makeApiKeyCredential({
      name: "Updated Key",
      _version: 2,
    });
    mockRepository.findById.mockResolvedValue(ok({ data: existing }));
    mockRepository.update.mockResolvedValue(ok({ data: updated }));

    const result = await updateCredential({
      ctx,
      id: TEST_ID,
      data: { type: "apiKey", name: "Updated Key" },
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ data: updated } as never);
    expect(mockRepository.update).toHaveBeenCalledWith({
      ctx,
      id: TEST_ID,
      data: expect.objectContaining({ type: "apiKey", name: "Updated Key" }),
    });
  });

  it("should return notFound err when credential does not exist", async () => {
    mockRepository.findById.mockResolvedValue(ok({ data: null }));

    const result = await updateCredential({
      ctx,
      id: TEST_ID,
      data: { type: "apiKey", name: "Updated" },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
    expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
  });

  it("should return err when repository update fails", async () => {
    const existing = makeApiKeyCredential();
    mockRepository.findById.mockResolvedValue(ok({ data: existing }));
    mockRepository.update.mockResolvedValue(
      err(Err.code("unknown", { message: "Mongo database error" })),
    );

    const result = await updateCredential({
      ctx,
      id: TEST_ID,
      data: { type: "apiKey", name: "Updated" },
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});

describe("deleteCredential", () => {
  beforeEach(resetMocks);

  it("should delete the credential by id and tenant", async () => {
    mockRepository.deleteById.mockResolvedValue(ok());

    const result = await deleteCredential({ ctx, id: TEST_ID });

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

    const result = await deleteCredential({ ctx, id: TEST_ID });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  });
});
