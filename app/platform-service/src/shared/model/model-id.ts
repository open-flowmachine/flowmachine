import { randomUUIDv7 } from "bun";
import z from "zod";

const idSchema = z.uuidv7();
type Id = z.infer<typeof idSchema>;

const newId = () => randomUUIDv7();

export { idSchema, type Id, newId };
