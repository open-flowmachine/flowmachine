import { beforeEach, expect, mock, test } from "bun:test";
import { err, ok } from "neverthrow";

import type { Credential } from "@/module/credential/credential-model";
import type { Tenant } from "@/shared/model/model-tenant";

import { Err } from "@/shared/err/err";
import { type Id, idSchema } from "@/shared/model/model-id";

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

const { makeCredentialService } = await import("./credential-service");
const credentialService = makeCredentialService();

// --- Helpers ---

const now = new Date("2026-01-01");

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
  expiredAt: new Date("2027-01-01"),
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

beforeEach(resetMocks);

test("create: given an apiKey payload, when inserted, then returns the new id", async () => {
  // given
  mockRepository.insert.mockResolvedValue(ok());

  // when
  const result = await credentialService.create({
    ctx,
    payload: {
      type: "apiKey",
      name: "New Key",
      apiKey: "sk-new-123",
      expiredAt: new Date("2027-01-01"),
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
      type: "apiKey",
      name: "New Key",
      apiKey: "sk-new-123",
    }),
  });
});

test("create: given a basic payload, when inserted, then returns the new id", async () => {
  // given
  mockRepository.insert.mockResolvedValue(ok());

  // when
  const result = await credentialService.create({
    ctx,
    payload: {
      type: "basic",
      name: "New Basic",
      username: "user",
      password: "pass",
      expiredAt: new Date("2027-01-01"),
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
      type: "basic",
      name: "New Basic",
      username: "user",
      password: "pass",
    }),
  });
});

test("create: given a valid payload, when repository insert fails, then returns err", async () => {
  // given
  mockRepository.insert.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await credentialService.create({
    ctx,
    payload: {
      type: "apiKey",
      name: "New Key",
      apiKey: "sk-new-123",
      expiredAt: new Date("2027-01-01"),
    },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("get: given an existing credential id, when fetched, then returns the credential", async () => {
  // given
  const credential = makeApiKeyCredential();
  mockRepository.findById.mockResolvedValue(ok({ data: credential }));

  // when
  const result = await credentialService.get({ ctx, id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: credential } as never);
  expect(mockRepository.findById).toHaveBeenCalledWith({ ctx, id: TEST_ID });
});

test("get: given a non-existent credential id, when fetched, then returns notFound err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(ok({ data: null }));

  // when
  const result = await credentialService.get({ ctx, id: TEST_ID });

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
  const result = await credentialService.get({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("list: given existing credentials, when listed, then returns all credentials for the tenant", async () => {
  // given
  const credentials = [makeApiKeyCredential(), makeBasicCredential()];
  mockRepository.findMany.mockResolvedValue(ok({ data: credentials }));

  // when
  const result = await credentialService.list({ ctx });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: credentials } as never);
  expect(mockRepository.findMany).toHaveBeenCalledWith({ ctx });
});

test("list: given a tenant, when repository fails, then returns err", async () => {
  // given
  mockRepository.findMany.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await credentialService.list({ ctx });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("update: given an existing credential, when updated, then returns the updated data", async () => {
  // given
  const existing = makeApiKeyCredential();
  const updated = makeApiKeyCredential({ name: "Updated Key", _version: 2 });
  mockRepository.findById.mockResolvedValue(ok({ data: existing }));
  mockRepository.update.mockResolvedValue(ok({ data: updated }));

  // when
  const result = await credentialService.update({
    ctx,
    id: TEST_ID,
    data: { type: "apiKey", name: "Updated Key" },
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: updated } as never);
  expect(mockRepository.update).toHaveBeenCalledWith({
    ctx,
    id: TEST_ID,
    data: expect.objectContaining({ type: "apiKey", name: "Updated Key" }),
  });
});

test("update: given a non-existent credential id, when updated, then returns notFound err", async () => {
  // given
  mockRepository.findById.mockResolvedValue(ok({ data: null }));

  // when
  const result = await credentialService.update({
    ctx,
    id: TEST_ID,
    data: { type: "apiKey", name: "Updated" },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty("code", "notFound");
});

test("update: given an existing credential, when repository update fails, then returns err", async () => {
  // given
  const existing = makeApiKeyCredential();
  mockRepository.findById.mockResolvedValue(ok({ data: existing }));
  mockRepository.update.mockResolvedValue(
    err(Err.code("unknown", { message: "Mongo database error" })),
  );

  // when
  const result = await credentialService.update({
    ctx,
    id: TEST_ID,
    data: { type: "apiKey", name: "Updated" },
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});

test("delete: given an existing credential id, when deleted, then succeeds", async () => {
  // given
  mockRepository.deleteById.mockResolvedValue(ok());

  // when
  const result = await credentialService.delete({ ctx, id: TEST_ID });

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
  const result = await credentialService.delete({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
});
