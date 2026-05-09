import type { Document } from "mongodb";

import { UTCDate } from "@date-fns/utc";
import z from "zod";

import { type Id, newId } from "@/shared/model/model-id";

const dateTimeSchema = z.date().or(z.iso.datetime());

type ModelBaseFields = {
  createdAt: z.infer<typeof dateTimeSchema>;
  updatedAt: z.infer<typeof dateTimeSchema>;
  _version: number;
};

type ExcludedUpdateModelFields =
  | "id"
  | Exclude<keyof ModelBaseFields, "_version">;

type PartialWithUndefined<T> = { [K in keyof T]?: T[K] | undefined };

type Model<T extends Document> = T &
  ModelBaseFields & {
    id: Id;
  };

const newModel = <T extends Document>(input: T) => {
  const now = new UTCDate();

  return {
    ...input,
    id: newId(),
    _version: 1,
    createdAt: now,
    updatedAt: now,
  } satisfies Model<T>;
};

export { dateTimeSchema, newModel };
export type {
  Model,
  ModelBaseFields,
  ExcludedUpdateModelFields,
  PartialWithUndefined,
};
