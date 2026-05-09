import { type Result, err, ok } from "neverthrow";

import { Err } from "@/shared/err/err";

const safeFn = async <T>(
  fn: () => Promise<T>,
  errMapper?: (error: unknown) => Err,
): Promise<Result<T, Err>> => {
  try {
    return ok(await fn());
  } catch (error) {
    return err(errMapper ? errMapper(error) : Err.from(error));
  }
};

export { safeFn };
