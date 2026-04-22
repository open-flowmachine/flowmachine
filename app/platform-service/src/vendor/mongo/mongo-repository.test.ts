import type { Document } from "mongodb";

import { beforeEach, expect, mock, test } from "bun:test";

import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

import { Err } from "@/shared/err/err";

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

mock.module("@/vendor/mongo/mongo-client", () => ({
  mongoClient: {
    db: () => ({
      collection: () => mockCollection,
    }),
  },
}));

// Import after mocking
const { makeMongoRepository, makeTenantAwareMongoRepository } =
  await import("./mongo-repository");

// --- Helpers ---

type TestDoc = Document & { name: string };

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;

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
  mockCollection.find.mockClear();
  mockCollection.find.mockReturnValue({
    toArray: mock(() => Promise.resolve([])),
  });
  mockCollection.findOne.mockClear();
  mockCollection.insertOne.mockClear();
  mockCollection.findOneAndUpdate.mockClear();
  mockCollection.deleteOne.mockClear();
};

// --- makeMongoRepository ---

const repo = makeMongoRepository<Model<TestDoc>>({
  collectionName: "test-collection",
  collectionIndexes: [{ key: { name: 1 } }],
});

beforeEach(resetMocks);

test("makeMongoRepository findMany: given documents in the collection, when called, then returns all documents mapped to models with id instead of _id", async () => {
  // given
  const mongoDocs = [makeMongoDoc(), makeMongoDoc({ name: "second" })];
  mockCollection.find.mockReturnValue({
    toArray: mock(() => Promise.resolve(mongoDocs)),
  });

  // when
  const result = await repo.findMany();

  // then
  expect(result.isOk()).toBe(true);
  const { data } = result._unsafeUnwrap();
  expect(data).toHaveLength(2);
  expect(data[0]).toHaveProperty("id", TEST_ID);
  expect(data[0]).not.toHaveProperty("_id");
  expect(data[1]).toHaveProperty("name", "second");
});

test("makeMongoRepository findMany: given a collection with configured indexes, when called, then creates indexes on the collection", async () => {
  // given

  // when
  await repo.findMany();

  // then
  expect(mockCollection.createIndexes).toHaveBeenCalledWith([
    { key: { name: 1 } },
  ]);
});

test("makeMongoRepository findMany: given a database error, when called, then returns err with Mongo database error message", async () => {
  // given
  mockCollection.find.mockReturnValue({
    toArray: mock(() => Promise.reject(new Error("connection lost"))),
  });

  // when
  const result = await repo.findMany();

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty(
    "message",
    "Mongo database error",
  );
});

test("makeMongoRepository findById: given an existing document, when called, then queries by _id and returns model with id instead of _id", async () => {
  // given
  const mongoDoc = makeMongoDoc();
  mockCollection.findOne.mockResolvedValue(mongoDoc);

  // when
  const result = await repo.findById({ id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  const { data } = result._unsafeUnwrap();
  expect(data).toHaveProperty("id", TEST_ID);
  expect(data).not.toHaveProperty("_id");
  expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: TEST_ID });
});

test("makeMongoRepository findById: given no matching document, when called, then returns ok with null data", async () => {
  // given
  mockCollection.findOne.mockResolvedValue(null);

  // when
  const result = await repo.findById({ id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(result._unsafeUnwrap()).toEqual({ data: null });
});

test("makeMongoRepository findById: given a database error, when called, then returns err with Mongo database error message", async () => {
  // given
  mockCollection.findOne.mockRejectedValue(new Error("timeout"));

  // when
  const result = await repo.findById({ id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty(
    "message",
    "Mongo database error",
  );
});

test("makeMongoRepository insert: given a model, when called, then maps model to mongo document before inserting", async () => {
  // given
  const model = makeTestModel();

  // when
  const result = await repo.insert({ data: model });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockCollection.insertOne).toHaveBeenCalledWith(
    expect.objectContaining({
      _id: TEST_ID,
      name: "test",
      _version: 1,
    }),
  );
});

test("makeMongoRepository insert: given a database error, when called, then returns err with Mongo database error message", async () => {
  // given
  mockCollection.insertOne.mockRejectedValueOnce(
    new Error("duplicate key"),
  );

  // when
  const result = await repo.insert({ data: makeTestModel() });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty(
    "message",
    "Mongo database error",
  );
});

test("makeMongoRepository update: given a model with _version, when called, then uses optimistic concurrency and strips id from $set", async () => {
  // given
  const updatedMongoDoc = {
    ...makeMongoDoc(),
    name: "updated",
    _version: 2,
  };
  mockCollection.findOneAndUpdate.mockResolvedValue(updatedMongoDoc);

  // when
  const result = await repo.update({
    id: TEST_ID,
    data: { id: TEST_ID, name: "updated", _version: 1 } as Partial<
      Model<TestDoc>
    >,
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
    { _id: TEST_ID, _version: 1 },
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

test("makeMongoRepository update: given data without _version, when called, then omits _version from the filter", async () => {
  // given
  const updatedMongoDoc = {
    ...makeMongoDoc(),
    name: "updated",
    _version: 2,
  };
  mockCollection.findOneAndUpdate.mockResolvedValue(updatedMongoDoc);

  // when
  const result = await repo.update({
    id: TEST_ID,
    data: { name: "updated" } as Partial<Model<TestDoc>>,
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
    { _id: TEST_ID },
    {
      $set: { name: "updated" },
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

test("makeMongoRepository deleteById: given an existing document, when called, then deletes by _id and returns ok", async () => {
  // given

  // when
  const result = await repo.deleteById({ id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: TEST_ID });
});

test("makeMongoRepository deleteById: given a database error, when called, then returns err with Mongo database error message", async () => {
  // given
  mockCollection.deleteOne.mockRejectedValueOnce(new Error("fail"));

  // when
  const result = await repo.deleteById({ id: TEST_ID });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty(
    "message",
    "Mongo database error",
  );
});

// --- makeTenantAwareMongoRepository ---

type TenantDoc = TestDoc & { tenant: Tenant };

const tenant: Tenant = { id: TEST_ID, type: "organization" };
const ctx = { tenant };

const tenantRepo = makeTenantAwareMongoRepository<Model<TenantDoc>>({
  collectionName: "tenant-collection",
});

test("makeTenantAwareMongoRepository findMany: given a tenant ctx, when called, then filters by tenant and returns mapped models", async () => {
  // given
  const mongoDocs = [makeMongoDoc()];
  mockCollection.find.mockReturnValue({
    toArray: mock(() => Promise.resolve(mongoDocs)),
  });

  // when
  const result = await tenantRepo.findMany({ ctx });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockCollection.find).toHaveBeenCalledWith({ _tenant: tenant });
  const { data } = result._unsafeUnwrap();
  expect(data[0]).toHaveProperty("id", TEST_ID);
  expect(data[0]).not.toHaveProperty("_id");
});

test("makeTenantAwareMongoRepository findMany: given a tenant ctx and optional filter, when called, then merges filter into tenant query", async () => {
  // given
  const mongoDocs = [makeMongoDoc()];
  mockCollection.find.mockReturnValue({
    toArray: mock(() => Promise.resolve(mongoDocs)),
  });

  // when
  const result = await tenantRepo.findMany({
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

test("makeTenantAwareMongoRepository findMany: given a tenant ctx, when called, then creates tenant index plus any custom indexes", async () => {
  // given

  // when
  await tenantRepo.findMany({ ctx });

  // then
  expect(mockCollection.createIndexes).toHaveBeenCalledWith([
    { key: { "tenant.id": 1, "tenant.type": 1 } },
  ]);
});

test("makeTenantAwareMongoRepository findById: given a tenant ctx and id, when called, then filters by _id and tenant", async () => {
  // given
  const mongoDoc = makeMongoDoc();
  mockCollection.findOne.mockResolvedValue(mongoDoc);

  // when
  const result = await tenantRepo.findById({ ctx, id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockCollection.findOne).toHaveBeenCalledWith({
    _id: TEST_ID,
    _tenant: tenant,
  });
});

test("makeTenantAwareMongoRepository insert: given a tenant ctx and model, when called, then attaches _tenant to the inserted document", async () => {
  // given
  const model = makeTestModel() as unknown as Model<TenantDoc>;

  // when
  const result = await tenantRepo.insert({ ctx, data: model });

  // then
  expect(result.isOk()).toBe(true);
  const insertedDoc = (
    mockCollection.insertOne.mock.calls as unknown[][]
  )[0]![0] as Record<string, unknown>;
  expect(insertedDoc).toHaveProperty("_id", TEST_ID);
  expect(insertedDoc).toHaveProperty("_tenant", tenant);
  expect(insertedDoc).not.toHaveProperty("id");
});

test("makeTenantAwareMongoRepository update: given a tenant ctx, when called, then includes tenant in the filter for optimistic concurrency", async () => {
  // given
  const updatedMongoDoc = {
    ...makeMongoDoc(),
    name: "updated",
    _version: 2,
  };
  mockCollection.findOneAndUpdate.mockResolvedValue(updatedMongoDoc);

  // when
  const result = await tenantRepo.update({
    ctx,
    id: TEST_ID,
    data: { name: "updated", _version: 1 } as Partial<Model<TenantDoc>>,
  });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
    { _id: TEST_ID, _version: 1, _tenant: tenant },
    {
      $set: { name: "updated" },
      $inc: { _version: 1 },
    },
    { returnDocument: "after" },
  );
});

test("makeTenantAwareMongoRepository update: given data without _version, when called, then omits _version from the filter but keeps tenant", async () => {
  // given
  const updatedMongoDoc = {
    ...makeMongoDoc(),
    name: "updated",
    _version: 2,
  };
  mockCollection.findOneAndUpdate.mockResolvedValue(updatedMongoDoc);

  // when
  const result = await tenantRepo.update({
    ctx,
    id: TEST_ID,
    data: { name: "updated" } as Partial<Model<TenantDoc>>,
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

test("makeTenantAwareMongoRepository deleteById: given a tenant ctx and id, when called, then filters by _id and tenant", async () => {
  // given

  // when
  const result = await tenantRepo.deleteById({ ctx, id: TEST_ID });

  // then
  expect(result.isOk()).toBe(true);
  expect(mockCollection.deleteOne).toHaveBeenCalledWith({
    _id: TEST_ID,
    _tenant: tenant,
  });
});
