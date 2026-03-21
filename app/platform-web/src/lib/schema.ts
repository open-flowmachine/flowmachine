import { z } from "zod/v4";

const idSchema = z.uuidv7();
type Id = z.infer<typeof idSchema>;

const datetimeSchema = z.iso.datetime();
type DateTime = z.infer<typeof datetimeSchema>;

type Model<T> = T & {
  id: Id;
  createdAt: DateTime;
  updatedAt: DateTime;
};

export { idSchema, datetimeSchema };
export type { Id, DateTime, Model };
