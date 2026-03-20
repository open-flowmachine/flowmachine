import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { Document } from "mongodb";
import { Err } from "@/shared/err/err";
import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

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

describe("makeMongoRepository", () => {
  const repo = makeMongoRepository<Model<TestDoc>>({
    collectionName: "test-collection",
    collectionIndexes: [{ key: { name: 1 } }],
  });

  beforeEach(resetMocks);

  describe("findMany", () => {
    it("should return all documents mapped to models (with id instead of _id)", async () => {
      const mongoDocs = [makeMongoDoc(), makeMongoDoc({ name: "second" })];
      mockCollection.find.mockReturnValue({
        toArray: mock(() => Promise.resolve(mongoDocs)),
      });

      const result = await repo.findMany();

      expect(result.isOk()).toBe(true);
      const { data } = result._unsafeUnwrap();
      expect(data).toHaveLength(2);
      expect(data[0]).toHaveProperty("id", TEST_ID);
      expect(data[0]).not.toHaveProperty("_id");
      expect(data[1]).toHaveProperty("name", "second");
    });

    it("should create indexes on the collection", async () => {
      await repo.findMany();

      expect(mockCollection.createIndexes).toHaveBeenCalledWith([
        { key: { name: 1 } },
      ]);
    });

    it("should return err on failure", async () => {
      mockCollection.find.mockReturnValue({
        toArray: mock(() => Promise.reject(new Error("connection lost"))),
      });

      const result = await repo.findMany();

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
      expect(result._unsafeUnwrapErr()).toHaveProperty(
        "message",
        "Mongo database error",
      );
    });
  });

  describe("findById", () => {
    it("should query by _id and return the document mapped to model", async () => {
      const mongoDoc = makeMongoDoc();
      mockCollection.findOne.mockResolvedValue(mongoDoc);

      const result = await repo.findById({ id: TEST_ID });

      expect(result.isOk()).toBe(true);
      const { data } = result._unsafeUnwrap();
      expect(data).toHaveProperty("id", TEST_ID);
      expect(data).not.toHaveProperty("_id");
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: TEST_ID });
    });

    it("should return null data when document not found", async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repo.findById({ id: TEST_ID });

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ data: null });
    });

    it("should return err on failure", async () => {
      mockCollection.findOne.mockRejectedValue(new Error("timeout"));

      const result = await repo.findById({ id: TEST_ID });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
      expect(result._unsafeUnwrapErr()).toHaveProperty(
        "message",
        "Mongo database error",
      );
    });
  });

  describe("insert", () => {
    it("should map model to mongo document before inserting", async () => {
      const model = makeTestModel();

      const result = await repo.insert({ data: model });

      expect(result.isOk()).toBe(true);
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: TEST_ID,
          name: "test",
          _version: 1,
        }),
      );
    });

    it("should return err on failure", async () => {
      mockCollection.insertOne.mockRejectedValueOnce(
        new Error("duplicate key"),
      );

      const result = await repo.insert({ data: makeTestModel() });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
      expect(result._unsafeUnwrapErr()).toHaveProperty(
        "message",
        "Mongo database error",
      );
    });
  });

  describe("update", () => {
    it("should use optimistic concurrency with _version and strip id from $set", async () => {
      const updatedMongoDoc = {
        ...makeMongoDoc(),
        name: "updated",
        _version: 2,
      };
      mockCollection.findOneAndUpdate.mockResolvedValue(updatedMongoDoc);

      const result = await repo.update({
        id: TEST_ID,
        data: { id: TEST_ID, name: "updated", _version: 1 } as Partial<
          Model<TestDoc>
        >,
      });

      expect(result.isOk()).toBe(true);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: TEST_ID, _version: 1 },
        {
          $set: { name: "updated", _version: 1 },
          $inc: { _version: 1 },
        },
        { returnDocument: "after" },
      );
      // Result should be mapped back to model (id, not _id)
      const { data } = result._unsafeUnwrap();
      expect(data).toHaveProperty("id", TEST_ID);
      expect(data).not.toHaveProperty("_id");
    });

    it("should return null data when document not found (version mismatch)", async () => {
      mockCollection.findOneAndUpdate.mockResolvedValue(null);

      const result = await repo.update({
        id: TEST_ID,
        data: { _version: 1 } as Partial<Model<TestDoc>>,
      });

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ data: null });
    });

    it("should return err on failure", async () => {
      mockCollection.findOneAndUpdate.mockRejectedValue(new Error("fail"));

      const result = await repo.update({
        id: TEST_ID,
        data: { _version: 1 } as Partial<Model<TestDoc>>,
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
      expect(result._unsafeUnwrapErr()).toHaveProperty(
        "message",
        "Mongo database error",
      );
    });
  });

  describe("deleteById", () => {
    it("should delete by _id", async () => {
      const result = await repo.deleteById({ id: TEST_ID });

      expect(result.isOk()).toBe(true);
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: TEST_ID });
    });

    it("should return err on failure", async () => {
      mockCollection.deleteOne.mockRejectedValueOnce(new Error("fail"));

      const result = await repo.deleteById({ id: TEST_ID });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
      expect(result._unsafeUnwrapErr()).toHaveProperty(
        "message",
        "Mongo database error",
      );
    });
  });
});

// --- makeTenantAwareMongoRepository ---

describe("makeTenantAwareMongoRepository", () => {
  type TenantDoc = TestDoc & { tenant: Tenant };

  const tenant: Tenant = { id: TEST_ID, type: "organization" };
  const ctx = { tenant };

  const repo = makeTenantAwareMongoRepository<Model<TenantDoc>>({
    collectionName: "tenant-collection",
  });

  beforeEach(resetMocks);

  describe("findMany", () => {
    it("should filter by tenant and return mapped models", async () => {
      const mongoDocs = [makeMongoDoc()];
      mockCollection.find.mockReturnValue({
        toArray: mock(() => Promise.resolve(mongoDocs)),
      });

      const result = await repo.findMany({ ctx });

      expect(result.isOk()).toBe(true);
      expect(mockCollection.find).toHaveBeenCalledWith({ _tenant: tenant });
      const { data } = result._unsafeUnwrap();
      expect(data[0]).toHaveProperty("id", TEST_ID);
      expect(data[0]).not.toHaveProperty("_id");
    });

    it("should merge optional filter into tenant query", async () => {
      const mongoDocs = [makeMongoDoc()];
      mockCollection.find.mockReturnValue({
        toArray: mock(() => Promise.resolve(mongoDocs)),
      });

      const result = await repo.findMany({
        ctx,
        filter: { "projects.id": "some-project-id" },
      });

      expect(result.isOk()).toBe(true);
      expect(mockCollection.find).toHaveBeenCalledWith({
        _tenant: tenant,
        "projects.id": "some-project-id",
      });
    });

    it("should create tenant index plus any custom indexes", async () => {
      await repo.findMany({ ctx });

      expect(mockCollection.createIndexes).toHaveBeenCalledWith([
        { key: { "tenant.id": 1, "tenant.type": 1 } },
      ]);
    });
  });

  describe("findById", () => {
    it("should filter by _id and tenant", async () => {
      const mongoDoc = makeMongoDoc();
      mockCollection.findOne.mockResolvedValue(mongoDoc);

      const result = await repo.findById({ ctx, id: TEST_ID });

      expect(result.isOk()).toBe(true);
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: TEST_ID,
        _tenant: tenant,
      });
    });
  });

  describe("insert", () => {
    it("should map model to mongo document and attach _tenant", async () => {
      const model = makeTestModel() as unknown as Model<TenantDoc>;

      const result = await repo.insert({ ctx, data: model });

      expect(result.isOk()).toBe(true);
      const insertedDoc = (
        mockCollection.insertOne.mock.calls as unknown[][]
      )[0]![0] as Record<string, unknown>;
      expect(insertedDoc).toHaveProperty("_id", TEST_ID);
      expect(insertedDoc).toHaveProperty("_tenant", tenant);
      expect(insertedDoc).not.toHaveProperty("id");
    });
  });

  describe("update", () => {
    it("should include tenant in the filter for optimistic concurrency", async () => {
      const updatedMongoDoc = {
        ...makeMongoDoc(),
        name: "updated",
        _version: 2,
      };
      mockCollection.findOneAndUpdate.mockResolvedValue(updatedMongoDoc);

      const result = await repo.update({
        ctx,
        id: TEST_ID,
        data: { name: "updated", _version: 1 } as Partial<Model<TenantDoc>>,
      });

      expect(result.isOk()).toBe(true);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: TEST_ID, _version: 1, _tenant: tenant },
        {
          $set: { name: "updated", _version: 1 },
          $inc: { _version: 1 },
        },
        { returnDocument: "after" },
      );
    });
  });

  describe("deleteById", () => {
    it("should filter by _id and tenant", async () => {
      const result = await repo.deleteById({ ctx, id: TEST_ID });

      expect(result.isOk()).toBe(true);
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: TEST_ID,
        _tenant: tenant,
      });
    });
  });
});
