import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { Document } from "mongodb";
import type { Id } from "@/lib/model/model-id";
import type { MongoModel } from "@/lib/model/model-mongo";
import type { Tenant } from "@/lib/model/model-tenant";

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

mock.module("@/lib/mongo/mongo-client", () => ({
  mongoClient: {
    db: () => ({
      collection: () => mockCollection,
    }),
  },
}));

// Import after mocking
const { makeMongoRepository, makeTenantAwareMongoRepository } = await import(
  "./mongo-repository"
);

// --- Helpers ---

type TestDoc = MongoModel<Document> & { name: string };

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;

const makeTestDoc = (overrides?: Partial<TestDoc>): TestDoc => ({
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
  const repo = makeMongoRepository<TestDoc>({
    collectionName: "test-collection",
    collectionIndexes: [{ key: { name: 1 } }],
  });

  beforeEach(resetMocks);

  describe("findMany", () => {
    it("should return all documents", async () => {
      const docs = [makeTestDoc(), makeTestDoc({ name: "second" })];
      mockCollection.find.mockReturnValue({
        toArray: mock(() => Promise.resolve(docs)),
      });

      const result = await repo.findMany();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ data: docs });
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
    });
  });

  describe("findById", () => {
    it("should query by _id and return the document", async () => {
      const doc = makeTestDoc();
      mockCollection.findOne.mockResolvedValue(doc);

      const result = await repo.findById({ id: TEST_ID });

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ data: doc });
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
    });
  });

  describe("insert", () => {
    it("should insert the document", async () => {
      const doc = makeTestDoc();

      const result = await repo.insert({ data: doc });

      expect(result.isOk()).toBe(true);
      expect(mockCollection.insertOne).toHaveBeenCalledWith(doc);
    });

    it("should return err on failure", async () => {
      mockCollection.insertOne.mockRejectedValueOnce(
        new Error("duplicate key"),
      );

      const result = await repo.insert({ data: makeTestDoc() });

      expect(result.isErr()).toBe(true);
    });
  });

  describe("update", () => {
    it("should use optimistic concurrency with _version", async () => {
      const updatedDoc = makeTestDoc({ name: "updated", _version: 2 });
      mockCollection.findOneAndUpdate.mockResolvedValue(updatedDoc);

      const result = await repo.update({
        id: TEST_ID,
        data: { name: "updated", _version: 1 } as Partial<TestDoc>,
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
      expect(result._unsafeUnwrap()).toEqual({ data: updatedDoc });
    });

    it("should return err on failure", async () => {
      mockCollection.findOneAndUpdate.mockRejectedValue(new Error("fail"));

      const result = await repo.update({
        id: TEST_ID,
        data: { _version: 1 } as Partial<TestDoc>,
      });

      expect(result.isErr()).toBe(true);
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
    });
  });
});

// --- makeTenantAwareMongoRepository ---

describe("makeTenantAwareMongoRepository", () => {
  type TenantDoc = TestDoc & { tenant: Tenant };

  const tenant: Tenant = { id: TEST_ID, type: "organization" };
  const ctx = { tenant };

  const repo = makeTenantAwareMongoRepository<TenantDoc>({
    collectionName: "tenant-collection",
  });

  beforeEach(resetMocks);

  describe("findMany", () => {
    it("should filter by tenant", async () => {
      const docs = [makeTestDoc()];
      mockCollection.find.mockReturnValue({
        toArray: mock(() => Promise.resolve(docs)),
      });

      const result = await repo.findMany({ ctx });

      expect(result.isOk()).toBe(true);
      expect(mockCollection.find).toHaveBeenCalledWith({ _tenant: tenant });
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
      const doc = makeTestDoc();
      mockCollection.findOne.mockResolvedValue(doc);

      const result = await repo.findById({ ctx, id: TEST_ID });

      expect(result.isOk()).toBe(true);
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: TEST_ID,
        _tenant: tenant,
      });
    });
  });

  describe("insert", () => {
    it("should attach _tenant to the inserted document", async () => {
      const doc = makeTestDoc() as unknown as TenantDoc;

      const result = await repo.insert({ ctx, data: doc });

      expect(result.isOk()).toBe(true);
      expect(mockCollection.insertOne).toHaveBeenCalledWith({
        ...doc,
        _tenant: tenant,
      });
    });
  });

  describe("update", () => {
    it("should include tenant in the filter for optimistic concurrency", async () => {
      const updatedDoc = makeTestDoc({ name: "updated", _version: 2 });
      mockCollection.findOneAndUpdate.mockResolvedValue(updatedDoc);

      const result = await repo.update({
        ctx,
        id: TEST_ID,
        data: { name: "updated", _version: 1 } as Partial<TenantDoc>,
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
