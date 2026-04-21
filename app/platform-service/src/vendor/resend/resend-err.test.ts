import { expect, test } from "bun:test";

import { Err } from "@/shared/err/err";
import { mapResendError } from "@/vendor/resend/resend-err";

test("mapResendError: given a plain Error, when mapped, then returns Err with resend message and unknown code", () => {
  // given
  const cause = new Error("API timeout");

  // when
  const result = mapResendError(cause);

  // then
  expect(result).toBeInstanceOf(Err);
  expect(result.message).toBe("Resend email service error");
  expect(result.code).toBe("unknown");
});

test("mapResendError: given a non-Error value, when mapped, then returns Err with resend message", () => {
  // given
  const cause = "something went wrong";

  // when
  const result = mapResendError(cause);

  // then
  expect(result).toBeInstanceOf(Err);
  expect(result.message).toBe("Resend email service error");
});

test("mapResendError: given an existing Err, when mapped, then returns the original Err unchanged", () => {
  // given
  const original = Err.code("notFound");

  // when
  const result = mapResendError(original);

  // then
  expect(result).toBe(original);
});
