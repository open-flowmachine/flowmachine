import type { Document, IndexDescription } from "mongodb";
import { err, ok } from "neverthrow";
import type { Id } from "@/lib/model/model-id";
import type { MongoModel } from "@/lib/model/model-mongo";
import type { Tenant } from "@/lib/model/model-tenant";
import { mongoClient } from "@/lib/mongo/mongo-client";

const makeMongoRepository = <T extends MongoModel<Document>>(input: {
  collectionName: string;
  collectionIndexes?: IndexDescription[];
}) => {
  const { collectionName, collectionIndexes } = input;

  const getCollection = async () => {
    const collection = mongoClient
      .db(process.env.MONGO_DB_NAME)
      .collection<MongoModel<Document>>(collectionName);
    if (collectionIndexes) {
      await collection.createIndexes(collectionIndexes);
    }
    return collection;
  };

  const findMany = async () => {
    try {
      const collection = await getCollection();
      const docs = await collection.find().toArray();
      return ok({ data: docs });
    } catch (error) {
      return err(error);
    }
  };

  const findById = async (input: { id: Id }) => {
    try {
      const { id } = input;
      const collection = await getCollection();
      const data = await collection.findOne({ _id: id });
      return ok({ data: data });
    } catch (error) {
      return err(error);
    }
  };

  const insert = async (input: { data: T }) => {
    try {
      const { data } = input;
      const collection = await getCollection();
      await collection.insertOne(data);
      return ok();
    } catch (error) {
      return err(error);
    }
  };

  const update = async (input: { id: Id; data: Partial<T> }) => {
    try {
      const { id, data } = input;
      const collection = await getCollection();
      const updatedData = await collection.findOneAndUpdate(
        { _id: id, _version: data._version },
        { $set: data, $inc: { _version: 1 } },
        { returnDocument: "after" },
      );
      return ok({ data: updatedData });
    } catch (error) {
      return err(error);
    }
  };

  const deleteById = async (input: { id: Id }) => {
    try {
      const { id } = input;
      const collection = await getCollection();
      await collection.deleteOne({ _id: id });
      return ok();
    } catch (error) {
      return err(error);
    }
  };

  return {
    findById,
    findMany,
    insert,
    update,
    deleteById,
  };
};

const makeTenantAwareMongoRepository = <
  T extends MongoModel<Document> & { tenant: Tenant },
>(input: {
  collectionName: string;
  collectionIndexes?: IndexDescription[];
}) => {
  const { collectionName, collectionIndexes } = input;

  const getCollection = async () => {
    const collection = mongoClient
      .db(process.env.MONGO_DB_NAME)
      .collection<MongoModel<Document> & { _tenant: Tenant }>(collectionName);
    await collection.createIndexes([
      { key: { "tenant.id": 1, "tenant.type": 1 } },
      ...(collectionIndexes ?? []),
    ]);
    return collection;
  };

  const findMany = async (input: { ctx: { tenant: Tenant } }) => {
    try {
      const { ctx } = input;
      const collection = await getCollection();
      const docs = await collection.find({ _tenant: ctx.tenant }).toArray();
      return ok({ data: docs });
    } catch (error) {
      return err(error);
    }
  };

  const findById = async (input: { ctx: { tenant: Tenant }; id: Id }) => {
    try {
      const { ctx, id } = input;
      const collection = await getCollection();
      const data = await collection.findOne({ _id: id, _tenant: ctx.tenant });
      return ok({ data: data });
    } catch (error) {
      return err(error);
    }
  };

  const insert = async (input: { ctx: { tenant: Tenant }; data: T }) => {
    try {
      const { ctx, data } = input;
      const collection = await getCollection();
      await collection.insertOne({ ...data, _tenant: ctx.tenant });
      return ok();
    } catch (error) {
      return err(error);
    }
  };

  const update = async (input: {
    ctx: { tenant: Tenant };
    id: Id;
    data: Partial<T>;
  }) => {
    try {
      const { ctx, id, data } = input;
      const collection = await getCollection();
      const updatedData = await collection.findOneAndUpdate(
        { _id: id, _version: data._version, _tenant: ctx.tenant },
        { $set: data, $inc: { _version: 1 } },
        { returnDocument: "after" },
      );
      return ok({ data: updatedData });
    } catch (error) {
      return err(error);
    }
  };

  const deleteById = async (input: { ctx: { tenant: Tenant }; id: Id }) => {
    try {
      const { ctx, id } = input;
      const collection = await getCollection();
      await collection.deleteOne({ _id: id, _tenant: ctx.tenant });
      return ok();
    } catch (error) {
      return err(error);
    }
  };

  return {
    findById,
    findMany,
    insert,
    update,
    deleteById,
  };
};

export { makeMongoRepository, makeTenantAwareMongoRepository };
