import type { Document, WithId } from "mongodb";

import type { Model } from "@/shared/model/model";
import type { MongoDoc } from "@/vendor/mongo/mongo-type";

import { Err } from "@/shared/err/err";

const mapMongoError = (error: unknown) => {
  return Err.from(error, { message: "Mongo database error" });
};

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

export { mapMongoError, mapFromMongoDoc, mapToMongoDoc };
