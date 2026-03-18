import type { Document } from "mongodb";
import type { Id } from "@/lib/model/model-id";

type MongoModel<T extends Document> = T & {
  _id: Id;
  _version: number;
  createdAt: Date;
  updatedAt: Date;
};

export type { MongoModel };
