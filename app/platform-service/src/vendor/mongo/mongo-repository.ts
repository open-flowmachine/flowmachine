import type { Document, Filter, IndexDescription, WithId } from "mongodb";

import type { Err } from "@/shared/err/err";
import type { Id } from "@/shared/model/model-id";
import type {
  TenantAware,
  TenantAwareDisabled,
  TenantAwareEnabled,
  TenantUnaware,
} from "@/shared/model/model-tenant";
import type { MongoCtx, MongoDoc } from "@/vendor/mongo/mongo-type";

import { safeFn } from "@/shared/err/err-util";
import { type Model, type PartialWithUndefined } from "@/shared/model/model";
import { getEnv } from "@/vendor/env/env";
import { mongoClient } from "@/vendor/mongo/mongo-client";
import {
  mapFromMongoDoc,
  mapMongoError,
  mapToMongoDoc,
} from "@/vendor/mongo/mongo-mapper";

const getDb = () => mongoClient.db(getEnv().MONGO_DB_NAME);

const getCollection = async (input: {
  collectionName: string;
  collectionIndexes?: IndexDescription[] | undefined;
  isTenantAware: boolean;
}) => {
  const { collectionName, collectionIndexes = [], isTenantAware } = input;

  const collection = getDb().collection<MongoDoc>(collectionName);

  const indexes = isTenantAware
    ? [{ key: { "_tenant.id": 1, "_tenant.type": 1 } }, ...collectionIndexes]
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

  const tenantFilter = (ctx: TCtx): Filter<TModel> =>
    (isTenantAware && !ctx.dangerouslyDisableTenant
      ? { _tenant: ctx.tenant }
      : {}) as Filter<TModel>;

  const findMany = (input: {
    ctx: TCtx;
    filter?: Filter<TModel> | undefined;
  }) =>
    safeFn(async () => {
      const { ctx, filter } = input;
      const col = await collection();
      const docs = await col
        .find({ ...tenantFilter(ctx), ...filter } as Filter<MongoDoc>)
        .toArray();
      return { data: docs.map((doc) => mapFromMongoDoc<TModel>(doc)) };
    }, mapMongoError);

  const findById = (input: { ctx: TCtx; id: Id }) =>
    safeFn(async () => {
      const { ctx, id } = input;
      const col = await collection();
      const data = await col.findOne({
        _id: id,
        ...tenantFilter(ctx),
      } as Filter<MongoDoc>);
      return { data: data ? mapFromMongoDoc<TModel>(data) : null };
    }, mapMongoError);

  const insert = (input: { ctx: TCtx; data: TModel }) =>
    safeFn(async () => {
      const { ctx, data } = input;
      const col = await collection();
      const doc = ctx.dangerouslyDisableTenant
        ? mapToMongoDoc(data)
        : { ...mapToMongoDoc(data), _tenant: ctx.tenant };
      await col.insertOne(doc);
    }, mapMongoError);

  const update = (input: {
    ctx: TCtx;
    id: Id;
    data: Omit<PartialWithUndefined<TModel>, "id" | "_version">;
    expectedVersion?: number;
  }) =>
    safeFn(async () => {
      const { ctx, id, data, expectedVersion } = input;
      const col = await collection();
      const updatedData = await col.findOneAndUpdate(
        {
          _id: id,
          ...tenantFilter(ctx),
          ...(expectedVersion !== undefined
            ? { _version: expectedVersion }
            : {}),
        } as Filter<MongoDoc>,
        { $set: data, $inc: { _version: 1 } },
        { returnDocument: "after" },
      );
      return {
        data: updatedData ? mapFromMongoDoc<TModel>(updatedData) : null,
      };
    }, mapMongoError);

  const deleteById = (input: { ctx: TCtx; id: Id }) =>
    safeFn(async () => {
      const { ctx, id } = input;
      const col = await collection();
      await col.deleteOne({
        _id: id,
        ...tenantFilter(ctx),
      } as Filter<MongoDoc>);
    }, mapMongoError);

  return {
    findById,
    findMany,
    insert,
    update,
    deleteById,
  };
};

const prefixForChangeStream = (filter: Document): Document => {
  const out: Document = {};
  for (const [key, value] of Object.entries(filter)) {
    if (key.startsWith("$")) {
      out[key] = Array.isArray(value)
        ? value.map((entry) =>
            entry && typeof entry === "object"
              ? prefixForChangeStream(entry as Document)
              : entry,
          )
        : value;
      continue;
    }
    out[`fullDocument.${key}`] = value;
  }
  return out;
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
    isTenantAware && !ctx.dangerouslyDisableTenant
      ? { "fullDocument._tenant": ctx.tenant }
      : {};

  const subscribe = (input: {
    ctx: TCtx;
    filter?: Filter<TModel> | undefined;
    onChange: (data: TModel) => void;
    onError?: ((err: Err) => void) | undefined;
  }) =>
    safeFn(async () => {
      const { ctx, filter, onChange, onError } = input;

      const col = getDb().collection<MongoDoc>(collectionName);

      const pipeline: Document[] = [
        {
          $match: {
            ...getTenantMatch(ctx),
            ...prefixForChangeStream((filter ?? {}) as Document),
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

      return {
        unsubscribe: () =>
          safeFn(async () => {
            await cs.close();
          }, mapMongoError),
      };
    }, mapMongoError);

  return { subscribe };
};

export { makeMongoRepository, makeMongoChangeStream };
