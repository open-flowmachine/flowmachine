import type { Document } from "mongodb";

import { afterAll, beforeEach, expect, mock, spyOn, test } from "bun:test";

import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";
import type {
  Tenant,
  TenantAware,
  TenantAwareEnabled,
} from "@/shared/model/model-tenant";

import { Err } from "@/shared/err/err";
import { mongoClient } from "@/vendor/mongo/mongo-client";
import { makeMongoRepository } from "@/vendor/mongo/mongo-repository";

// --- Mock setup ---

const mockCollection = {
  createIndexes: mock(() => Promise.resolve()),
  find: mock(),
  findOne: mock(),
  insertOne: mock(() => Promise.resolve()),
  findOneAndUpdate: mock(),
  deleteOne: mock(() => Promise.resolve()),
};

mockCollection.find.mockReturnValue({
  toArray: mock(() => Promise.resolve([])),
});

const mockDb = { collection: () => mockCollection };
const dbSpy = spyOn(mongoClient, "db").mockReturnValue(
  mockDb as unknown as ReturnType<typeof mongoClient.db>,
);

// --- Helpers ---

type TestDoc = Document & { name: string };

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;

const tenant: Tenant = { id: TEST_ID, type: "organization" };
const ctx = { tenant };
const ctxDisabled = { dangerouslyDisableTenant: true } as const;

const makeTestModel = (
  overrides?: Partial<Model<TestDoc>>,
): Model<TestDoc> => ({
  id: TEST_ID,
  _version: 1,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  name: "test",
  ...overrides,
});

/** Simulates what MongoDB stores (_id instead of id) */
const makeMongoDoc = (overrides?: Partial<TestDoc>) => ({
  _id: TEST_ID,
  _version: 1,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  name: "test",
  ...overrides,
});

const resetMocks = () => {
  mockCollection.createIndexes.mockClear();
  mockCollection.find.mockReset();
  mockCollection.find.mockReturnValue({
    toArray: mock(() => Promise.resolve([])),
  });
  mockCollection.findOne.mockReset();
  mockCollection.insertOne.mockReset();
  mockCollection.insertOne.mockResolvedValue(undefined);
  mockCollection.findOneAndUpdate.mockReset();
  mockCollection.deleteOne.mockReset();
  mockCollection.deleteOne.mockResolvedValue(undefined);
  dbSpy.mockClear();
};

const repo = makeMongoRepository<
  Model<TestDoc>,
  TenantAwareEnabled,
  TenantAware
>({
  collectionName: "test-collection",
  collectionIndexes: [{ key: { name: 1 } }],
  isTenantAware: true,
});

beforeEach(resetMocks);

afterAll(() => {
  dbSpy.mockRestore();
});

test("makeMongoRepository findMany: given a tenant ctx, when called, then filters by tenant and returns mapped models", async () => {
  // given
  const mongoDocs = [makeMongoDoc(), makeMongoDoc({ name: "second" })];
  mockCollection.find.mockReturnValue({
    toArray: mock(() => Promise.resolve(mongoDocs)),
  });

  // when
  const result = await repo.findMany({ ctx });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockCollection.find).toHaveBeenCalledWith({ _tenant: tenant });
  const { data } = result._unsafeUnwrap();
  expect(data).toHaveLength(2);
  expect(data[0]).toHaveProperty("id", TEST_ID);
  expect(data[0]).not.toHaveProperty("_id");
  expect(data[1]).toHaveProperty("name", "second");
});

test("makeMongoRepository findMany: given a tenant ctx and optional filter, when called, then merges filter into tenant query", async () => {
  // given
  mockCollection.find.mockReturnValue({
    toArray: mock(() => Promise.resolve([makeMongoDoc()])),
  });

  // when
  const result = await repo.findMany({
    ctx,
    filter: { "projects.id": "some-project-id" },
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockCollection.find).toHaveBeenCalledWith({
    _tenant: tenant,
    "projects.id": "some-project-id",
  });
});

test("makeMongoRepository findMany: given dangerouslyDisableTenant, when called, then omits tenant from filter", async () => {
  // given
  mockCollection.find.mockReturnValue({
    toArray: mock(() => Promise.resolve([])),
  });

  // when
  await repo.findMany({ ctx: ctxDisabled });

  // then
  expect(mockCollection.find).toHaveBeenCalledWith({});
});

test("makeMongoRepository findMany: given a collection with configured indexes, when called, then creates tenant index plus configured indexes", async () => {
  // given

  // when
  await repo.findMany({ ctx });

  // then
  expect(mockCollection.createIndexes).toHaveBeenCalledWith([
    { key: { "tenant.id": 1, "tenant.type": 1 } },
    { key: { name: 1 } },
  ]);
});

test("makeMongoRepository findMany: given a database error, when called, then returns err with Mongo database error message", async () => {
  // given
  mockCollection.find.mockReturnValue({
    toArray: mock(() => Promise.reject(new Error("connection lost"))),
  });

  // when
  const result = await repo.findMany({ ctx });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty(
    "message",
    "Mongo database error",
  );
});

test("makeMongoRepository findById: given a tenant ctx, when called, then filters by _id and tenant", async () => {
  // given
  mockCollection.findOne.mockResolvedValue(makeMongoDoc());

  // when
  const result = await repo.findById({ ctx, id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockCollection.findOne).toHaveBeenCalledWith({
    _id: TEST_ID,
    _tenant: tenant,
  });
  const { data } = result._unsafeUnwrap();
  expect(data).toHaveProperty("id", TEST_ID);
  expect(data).not.toHaveProperty("_id");
});

test("makeMongoRepository findById: given dangerouslyDisableTenant, when called, then queries by _id only", async () => {
  // given
  mockCollection.findOne.mockResolvedValue(makeMongoDoc());

  // when
  await repo.findById({ ctx: ctxDisabled, id: TEST_ID });

  // then
  expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: TEST_ID });
});

test("makeMongoRepository findById: given no matching document, when called, then returns ok with null data", async () => {
  // given
  mockCollection.findOne.mockResolvedValue(null);

  // when
  const result = await repo.findById({ ctx, id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: null });
});

test("makeMongoRepository findById: given a database error, when called, then returns err with Mongo database error message", async () => {
  // given
  mockCollection.findOne.mockRejectedValue(new Error("timeout"));

  // when
  const result = await repo.findById({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty(
    "message",
    "Mongo database error",
  );
});

test("makeMongoRepository insert: given a tenant ctx, when called, then attaches _tenant to inserted document", async () => {
  // given
  const model = makeTestModel();

  // when
  const result = await repo.insert({ ctx, data: model });

  // then
  expect(result.isOk()).toBe(true);
  const insertedDoc = (
    mockCollection.insertOne.mock.calls as unknown[][]
  )[0]![0] as Record<string, unknown>;
  expect(insertedDoc).toHaveProperty("_id", TEST_ID);
  expect(insertedDoc).toHaveProperty("_tenant", tenant);
  expect(insertedDoc).not.toHaveProperty("id");
});

test("makeMongoRepository insert: given dangerouslyDisableTenant, when called, then inserts without _tenant", async () => {
  // given

  // when
  const result = await repo.insert({ ctx: ctxDisabled, data: makeTestModel() });

  // then
  expect(result.isOk()).toBe(true);
  const insertedDoc = (
    mockCollection.insertOne.mock.calls as unknown[][]
  )[0]![0] as Record<string, unknown>;
  expect(insertedDoc).toHaveProperty("_id", TEST_ID);
  expect(insertedDoc).not.toHaveProperty("_tenant");
});

test("makeMongoRepository insert: given a database error, when called, then returns err with Mongo database error message", async () => {
  // given
  mockCollection.insertOne.mockRejectedValueOnce(new Error("duplicate key"));

  // when
  const result = await repo.insert({ ctx, data: makeTestModel() });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty(
    "message",
    "Mongo database error",
  );
});

test("makeMongoRepository update: given a tenant ctx and _version, when called, then includes tenant and version in filter", async () => {
  // given
  const updatedMongoDoc = {
    ...makeMongoDoc(),
    name: "updated",
    _version: 2,
  };
  mockCollection.findOneAndUpdate.mockResolvedValue(updatedMongoDoc);

  // when
  const result = await repo.update({
    ctx,
    id: TEST_ID,
    data: { name: "updated", _version: 1 } as Partial<Model<TestDoc>>,
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
    { _id: TEST_ID, _tenant: tenant, _version: 1 },
    {
      $set: { name: "updated" },
      $inc: { _version: 1 },
    },
    { returnDocument: "after" },
  );
  const { data } = result._unsafeUnwrap();
  expect(data).toHaveProperty("id", TEST_ID);
  expect(data).not.toHaveProperty("_id");
});

test("makeMongoRepository update: given data without _version, when called, then omits _version from the filter but keeps tenant", async () => {
  // given
  mockCollection.findOneAndUpdate.mockResolvedValue({
    ...makeMongoDoc(),
    name: "updated",
    _version: 2,
  });

  // when
  const result = await repo.update({
    ctx,
    id: TEST_ID,
    data: { name: "updated" } as Partial<Model<TestDoc>>,
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
    { _id: TEST_ID, _tenant: tenant },
    {
      $set: { name: "updated" },
      $inc: { _version: 1 },
    },
    { returnDocument: "after" },
  );
});

test("makeMongoRepository update: given dangerouslyDisableTenant, when called, then omits tenant from filter", async () => {
  // given
  mockCollection.findOneAndUpdate.mockResolvedValue({
    ...makeMongoDoc(),
    _version: 2,
  });

  // when
  await repo.update({
    ctx: ctxDisabled,
    id: TEST_ID,
    data: { _version: 1 } as Partial<Model<TestDoc>>,
  });

  // then
  expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
    { _id: TEST_ID, _version: 1 },
    {
      $set: {},
      $inc: { _version: 1 },
    },
    { returnDocument: "after" },
  );
});

test("makeMongoRepository update: given a version mismatch, when called, then returns ok with null data", async () => {
  // given
  mockCollection.findOneAndUpdate.mockResolvedValue(null);

  // when
  const result = await repo.update({
    ctx,
    id: TEST_ID,
    data: { _version: 1 } as Partial<Model<TestDoc>>,
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: null });
});

test("makeMongoRepository update: given a database error, when called, then returns err with Mongo database error message", async () => {
  // given
  mockCollection.findOneAndUpdate.mockRejectedValue(new Error("fail"));

  // when
  const result = await repo.update({
    ctx,
    id: TEST_ID,
    data: { _version: 1 } as Partial<Model<TestDoc>>,
  });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty(
    "message",
    "Mongo database error",
  );
});

test("makeMongoRepository deleteById: given a tenant ctx, when called, then deletes by _id and tenant", async () => {
  // given

  // when
  const result = await repo.deleteById({ ctx, id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockCollection.deleteOne).toHaveBeenCalledWith({
    _id: TEST_ID,
    _tenant: tenant,
  });
});

test("makeMongoRepository deleteById: given dangerouslyDisableTenant, when called, then deletes by _id only", async () => {
  // given

  // when
  await repo.deleteById({ ctx: ctxDisabled, id: TEST_ID });

  // then
  expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: TEST_ID });
});

test("makeMongoRepository deleteById: given a database error, when called, then returns err with Mongo database error message", async () => {
  // given
  mockCollection.deleteOne.mockRejectedValueOnce(new Error("fail"));

  // when
  const result = await repo.deleteById({ ctx, id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty(
    "message",
    "Mongo database error",
  );
});
