import { UTCDate } from "@date-fns/utc";
import type { Document } from "mongodb";
import { type Id, newId } from "@/lib/model/model-id";

type ModelBaseFields = {
  createdAt: Date;
  updatedAt: Date;
  _version: number;
};

type ExcludedUpdateModelFields =
  | "id"
  | Exclude<keyof ModelBaseFields, "_version">;

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

export { newModel };
export type { Model, ModelBaseFields, ExcludedUpdateModelFields };
