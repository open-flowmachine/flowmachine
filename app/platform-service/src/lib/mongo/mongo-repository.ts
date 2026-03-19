import type { Document, IndexDescription } from "mongodb";
import { err, ok } from "neverthrow";
import { type Model, ModelBaseFields } from "@/lib/model/model";
import type { Id } from "@/lib/model/model-id";
import type { Tenant } from "@/lib/model/model-tenant";
import { mongoClient } from "@/lib/mongo/mongo-client";
import { mapMongoError } from "@/lib/mongo/mongo-err";

type MongoModel<T extends Document> = T &
  ModelBaseFields & {
    _id: Id;
  };

const mapToMongoModel = <T extends Document>(model: Model<T>) => {
  const { id, ...rest } = model;
  return { _id: id, ...rest } as const;
};

const mapToModel = <T extends Document>(mongoModel: MongoModel<T>) => {
  const { _id, ...rest } = mongoModel;
  return { id: _id, ...rest } as const;
};

const makeMongoRepository = <T extends Model<Document>>(input: {
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
      return ok({ data: docs.map(mapToModel) });
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const findById = async (input: { id: Id }) => {
    try {
      const { id } = input;
      const collection = await getCollection();
      const data = await collection.findOne({ _id: id });
      return ok({ data: data ? mapToModel(data) : null });
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const insert = async (input: { data: T }) => {
    try {
      const { data } = input;
      const collection = await getCollection();
      await collection.insertOne(mapToMongoModel(data));
      return ok();
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const update = async (input: { id: Id; data: Partial<T> }) => {
    try {
      const { id, data } = input;
      const { id: _, ...rest } = data;
      const collection = await getCollection();
      const updatedData = await collection.findOneAndUpdate(
        { _id: id, _version: data._version },
        { $set: rest, $inc: { _version: 1 } },
        { returnDocument: "after" },
      );
      return ok({ data: updatedData ? mapToModel(updatedData) : null });
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const deleteById = async (input: { id: Id }) => {
    try {
      const { id } = input;
      const collection = await getCollection();
      await collection.deleteOne({ _id: id });
      return ok();
    } catch (error) {
      return err(mapMongoError(error));
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

const makeTenantAwareMongoRepository = <T extends Model<Document>>(input: {
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
      return ok({ data: docs.map(mapToModel) });
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const findById = async (input: { ctx: { tenant: Tenant }; id: Id }) => {
    try {
      const { ctx, id } = input;
      const collection = await getCollection();
      const data = await collection.findOne({ _id: id, _tenant: ctx.tenant });
      return ok({ data: data ? mapToModel(data) : null });
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const insert = async (input: { ctx: { tenant: Tenant }; data: T }) => {
    try {
      const { ctx, data } = input;
      const collection = await getCollection();
      await collection.insertOne({
        ...mapToMongoModel(data),
        _tenant: ctx.tenant,
      });
      return ok();
    } catch (error) {
      return err(mapMongoError(error));
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
      const { id: _, ...rest } = data;
      const updatedData = await collection.findOneAndUpdate(
        { _id: id, _version: data._version, _tenant: ctx.tenant },
        { $set: rest, $inc: { _version: 1 } },
        { returnDocument: "after" },
      );
      return ok({ data: updatedData ? mapToModel(updatedData) : null });
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const deleteById = async (input: { ctx: { tenant: Tenant }; id: Id }) => {
    try {
      const { ctx, id } = input;
      const collection = await getCollection();
      await collection.deleteOne({ _id: id, _tenant: ctx.tenant });
      return ok();
    } catch (error) {
      return err(mapMongoError(error));
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
