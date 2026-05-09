import type { Document, Filter, IndexDescription, WithId } from "mongodb";

import { err, ok } from "neverthrow";

import type { Id } from "@/shared/model/model-id";
import type {
  TenantAware,
  TenantAwareDisabled,
  TenantAwareEnabled,
  TenantUnaware,
} from "@/shared/model/model-tenant";
import type { MongoCtx, MongoDoc } from "@/vendor/mongo/mongo-type";

import { Err } from "@/shared/err/err";
import { type Model, type PartialWithUndefined } from "@/shared/model/model";
import { getEnv } from "@/vendor/env/env";
import { mongoClient } from "@/vendor/mongo/mongo-client";
import {
  mapFromMongoDoc,
  mapMongoError,
  mapToMongoDoc,
} from "@/vendor/mongo/mongo-mapper";

const getCollection = async (input: {
  collectionName: string;
  collectionIndexes?: IndexDescription[] | undefined;
  isTenantAware: boolean;
}) => {
  const { collectionName, collectionIndexes = [], isTenantAware } = input;

  const collection = mongoClient
    .db(getEnv().MONGO_DB_NAME)
    .collection<MongoDoc>(collectionName);

  const indexes = isTenantAware
    ? [{ key: { "tenant.id": 1, "tenant.type": 1 } }, ...collectionIndexes]
    : collectionIndexes;
  await collection.createIndexes(indexes);

  return collection;
};

const makeMongoRepository = <
  TModel extends Model<Document>,
  TIsTenantAware extends TenantAwareDisabled | TenantAwareEnabled,
  TCtx extends TIsTenantAware extends TenantAwareEnabled
    ? TenantAware<MongoCtx>
    : TenantUnaware<MongoCtx>,
>(input: {
  collectionName: string;
  collectionIndexes?: IndexDescription[] | undefined;
  isTenantAware: TIsTenantAware;
}) => {
  const { collectionName, collectionIndexes, isTenantAware } = input;

  const collection = () =>
    getCollection({ collectionName, collectionIndexes, isTenantAware });

  const tenantFilter = (ctx: TCtx) =>
    isTenantAware
      ? ctx.dangerouslyDisableTenant
        ? {}
        : { _tenant: ctx.tenant }
      : {};

  const findMany = async (input: {
    ctx: TCtx;
    filter?: Filter<TModel> | undefined;
  }) => {
    try {
      const { ctx, filter } = input;
      const col = await collection();
      const docs = await col
        .find({ ...tenantFilter(ctx), ...filter } as Document)
        .toArray();
      return ok({ data: docs.map((doc) => mapFromMongoDoc<TModel>(doc)) });
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const findById = async (input: { ctx: TCtx; id: Id }) => {
    try {
      const { ctx, id } = input;
      const col = await collection();
      const data = await col.findOne({ _id: id, ...tenantFilter(ctx) });
      return ok({ data: data ? mapFromMongoDoc<TModel>(data) : null });
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const insert = async (input: { ctx: TCtx; data: TModel }) => {
    try {
      const { ctx, data } = input;
      const col = await collection();
      const doc = ctx.dangerouslyDisableTenant
        ? mapToMongoDoc(data)
        : { ...mapToMongoDoc(data), _tenant: ctx.tenant };
      await col.insertOne(doc);
      return ok();
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const update = async (input: {
    ctx: TCtx;
    id: Id;
    data: PartialWithUndefined<TModel>;
  }) => {
    try {
      const { ctx, id, data } = input;
      const { id: _, _version, ...rest } = data;
      const col = await collection();
      const updatedData = await col.findOneAndUpdate(
        {
          _id: id,
          ...tenantFilter(ctx),
          ...(_version !== undefined ? { _version } : {}),
        },
        { $set: rest, $inc: { _version: 1 } },
        { returnDocument: "after" },
      );
      return ok({
        data: updatedData ? mapFromMongoDoc<TModel>(updatedData) : null,
      });
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  const deleteById = async (input: { ctx: TCtx; id: Id }) => {
    try {
      const { ctx, id } = input;
      const col = await collection();
      await col.deleteOne({ _id: id, ...tenantFilter(ctx) });
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

const makeMongoChangeStream = <
  TModel extends Model<Document>,
  TIsTenantAware extends TenantAwareDisabled | TenantAwareEnabled,
  TCtx extends TIsTenantAware extends TenantAwareEnabled
    ? TenantAware<MongoCtx>
    : TenantUnaware<MongoCtx>,
>(input: {
  collectionName: string;
  isTenantAware: TIsTenantAware;
}) => {
  const { collectionName, isTenantAware } = input;

  const getTenantMatch = (ctx: TCtx) =>
    isTenantAware
      ? ctx.dangerouslyDisableTenant
        ? {}
        : { "fullDocument._tenant": ctx.tenant }
      : {};

  const prefixFilterKeys = (filter: Document): Document => {
    const prefixed: Document = {};
    for (const key of Object.keys(filter)) {
      prefixed[`fullDocument.${key}`] = filter[key];
    }
    return prefixed;
  };

  const subscribe = async (input: {
    ctx: TCtx;
    filter?: Filter<TModel> | undefined;
    onChange: (data: TModel) => void;
    onError?: ((err: Err) => void) | undefined;
  }) => {
    try {
      const { ctx, filter, onChange, onError } = input;

      const col = mongoClient
        .db(getEnv().MONGO_DB_NAME)
        .collection<MongoDoc>(collectionName);

      const pipeline: Document[] = [
        {
          $match: {
            ...getTenantMatch(ctx),
            ...prefixFilterKeys((filter ?? {}) as Document),
          },
        },
      ];
      const cs = col.watch(pipeline, { fullDocument: "updateLookup" });

      cs.on("change", (event) => {
        if (!("fullDocument" in event) || !event.fullDocument) {
          return;
        }
        onChange(
          mapFromMongoDoc<TModel>(event.fullDocument as WithId<MongoDoc>),
        );
      });

      cs.on("error", (e) => {
        onError?.(mapMongoError(e));
      });

      return ok({
        unsubscribe: async () => {
          try {
            await cs.close();
            return ok();
          } catch (error) {
            return err(mapMongoError(error));
          }
        },
      });
    } catch (error) {
      return err(mapMongoError(error));
    }
  };

  return { subscribe };
};

export { makeMongoRepository, makeMongoChangeStream };
