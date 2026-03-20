import type { Document, IndexDescription, WithId } from "mongodb";
import { err, ok } from "neverthrow";
import { type Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";
import { mongoClient } from "@/vendor/mongo/mongo-client";
import { mapMongoError } from "@/vendor/mongo/mongo-err";

type MongoDoc = Document & { _id: Id };

const mapToMongoDoc = <T extends Model<Document>>(model: T) => {
  const { id, ...rest } = model;
  return { _id: id, ...rest };
};

const mapFromMongoDoc = <T extends Model<Document>>(
  doc: WithId<MongoDoc>,
): T => {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest } as T;
};

const getCollection = async (
  collectionName: string,
  collectionIndexes?: IndexDescription[],
) => {
  const collection = mongoClient
    .db(process.env.MONGO_DB_NAME)
    .collection<MongoDoc>(collectionName);
  if (collectionIndexes?.length) {
    await collection.createIndexes(collectionIndexes);
  }
  return collection;
};

const makeMongoRepository = <T extends Model<Document>>(input: {
  collectionName: string;
  collectionIndexes?: IndexDescription[];
}) => {
  const { collectionName, collectionIndexes } = input;

  const collection = () => getCollection(collectionName, collectionIndexes);

  const findMany = async () => {
    try {
      const col = await collection();
      const docs = await col.find().toArray();

      return ok({ data: docs.map((doc) => mapFromMongoDoc<T>(doc)) });
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const findById = async (input: { id: Id }) => {
    try {
      const { id } = input;

      const col = await collection();
      const data = await col.findOne({ _id: id });

      return ok({ data: data ? mapFromMongoDoc<T>(data) : null });
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const insert = async (input: { data: T }) => {
    try {
      const { data } = input;

      const col = await collection();
      await col.insertOne(mapToMongoDoc(data));

      return ok();
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const update = async (input: { id: Id; data: Partial<T> }) => {
    try {
      const { id, data } = input;
      const { id: _, _version, ...rest } = data;

      const col = await collection();
      const updatedData = await col.findOneAndUpdate(
        { _id: id, _version },
        { $set: rest, $inc: { _version: 1 } },
        { returnDocument: "after" },
      );
      return ok({
        data: updatedData ? mapFromMongoDoc<T>(updatedData) : null,
      });
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const deleteById = async (input: { id: Id }) => {
    try {
      const { id } = input;
      const col = await collection();
      await col.deleteOne({ _id: id });
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

  const collection = () =>
    getCollection(collectionName, [
      { key: { "tenant.id": 1, "tenant.type": 1 } },
      ...(collectionIndexes ?? []),
    ]);

  const findMany = async (input: {
    ctx: { tenant: Tenant };
    filter?: Document;
  }) => {
    try {
      const { ctx, filter } = input;
      const col = await collection();
      const docs = await col
        .find({ _tenant: ctx.tenant, ...filter })
        .toArray();
      return ok({ data: docs.map((doc) => mapFromMongoDoc<T>(doc)) });
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const findById = async (input: { ctx: { tenant: Tenant }; id: Id }) => {
    try {
      const { ctx, id } = input;
      const col = await collection();
      const data = await col.findOne({ _id: id, _tenant: ctx.tenant });
      return ok({ data: data ? mapFromMongoDoc<T>(data) : null });
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const insert = async (input: { ctx: { tenant: Tenant }; data: T }) => {
    try {
      const { ctx, data } = input;
      const col = await collection();
      await col.insertOne({
        ...mapToMongoDoc(data),
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
      const { id: _, _version, ...rest } = data;
      const col = await collection();
      const updatedData = await col.findOneAndUpdate(
        { _id: id, _version, _tenant: ctx.tenant },
        { $set: rest, $inc: { _version: 1 } },
        { returnDocument: "after" },
      );
      return ok({
        data: updatedData ? mapFromMongoDoc<T>(updatedData) : null,
      });
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const deleteById = async (input: { ctx: { tenant: Tenant }; id: Id }) => {
    try {
      const { ctx, id } = input;
      const col = await collection();
      await col.deleteOne({ _id: id, _tenant: ctx.tenant });
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
