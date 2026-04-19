import { expect, test } from "bun:test";

import { Err } from "@/shared/err/err";
import { mapMongoError } from "@/vendor/mongo/mongo-err";

test("mapMongoError: given a plain Error, when mapped, then returns Err with mongo message and unknown code", () => {
  // given
  const cause = new Error("connection lost");

  // when
  const result = mapMongoError(cause);

  // then
  expect(result).toBeInstanceOf(Err);
  expect(result.message).toBe("Mongo database error");
  expect(result.code).toBe("unknown");
});

test("mapMongoError: given a non-Error value, when mapped, then returns Err with mongo message", () => {
  // given
  const cause = "something went wrong";

  // when
  const result = mapMongoError(cause);

  // then
  expect(result).toBeInstanceOf(Err);
  expect(result.message).toBe("Mongo database error");
});

test("mapMongoError: given an existing Err, when mapped, then returns the original Err unchanged", () => {
  // given
  const original = Err.code("notFound");

  // when
  const result = mapMongoError(original);

  // then
  expect(result).toBe(original);
});
