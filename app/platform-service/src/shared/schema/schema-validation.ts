import type z from "zod";

import { err, ok } from "neverthrow";

import { Err } from "@/shared/err/err";

const validate = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  const parseResult = schema.safeParse(data);
  if (!parseResult.success) {
    const error = parseResult.error;
    return err(
      Err.code("unprocessableEntity", {
        cause: error,
        message: "Validation failed",
      }),
    );
  }
  return ok(parseResult.data);
};

export { validate };
