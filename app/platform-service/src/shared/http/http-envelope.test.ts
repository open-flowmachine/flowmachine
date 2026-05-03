import { expect, test } from "bun:test";

import { Err } from "@/shared/err/err";
import { errEnvelope, okEnvelope } from "@/shared/http/http-envelope";

test("okEnvelope: given no arguments, when called, then returns default envelope", () => {
  // given

  // when
  const result = okEnvelope();

  // then
  expect(result).toEqual({ status: 200, code: "ok", message: "ok" });
});

test("okEnvelope: given data payload, when called, then includes data in envelope", () => {
  // given
  const data = { id: "abc" };

  // when
  const result = okEnvelope({ data });

  // then
  expect(result).toEqual({
    status: 200,
    code: "ok",
    message: "ok",
    data: { id: "abc" },
  });
});

test("okEnvelope: given undefined data, when called, then omits data from envelope", () => {
  // given

  // when
  const result = okEnvelope({ data: undefined });

  // then
  expect(result).not.toHaveProperty("data");
  expect(result).toEqual({ status: 200, code: "ok", message: "ok" });
});

test("okEnvelope: given custom status, code, and message, when called, then overrides defaults", () => {
  // given
  const overrides = {
    status: 201,
    code: "created",
    message: "Resource created",
  };

  // when
  const result = okEnvelope(overrides);

  // then
  expect(result).toEqual({
    status: 201,
    code: "created",
    message: "Resource created",
  });
});

test("errEnvelope: given Err with notFound code, when called, then returns 404 envelope", () => {
  // given
  const err = Err.code("notFound");

  // when
  const result = errEnvelope(err);

  // then
  expect(result).toEqual({
    status: 404,
    code: "notFound",
    message: "Resource not found",
  });
});

test("errEnvelope: given Err with unknown code, when called, then returns 500 envelope", () => {
  // given
  const err = Err.code("unknown");

  // when
  const result = errEnvelope(err);

  // then
  expect(result).toEqual({
    status: 500,
    code: "unknown",
    message: "Internal server error",
  });
});

test("errEnvelope: given Err with custom message, when called, then uses custom message", () => {
  // given
  const err = Err.code("badRequest", { message: "Invalid input" });

  // when
  const result = errEnvelope(err);

  // then
  expect(result).toEqual({
    status: 400,
    code: "badRequest",
    message: "Invalid input",
  });
});
