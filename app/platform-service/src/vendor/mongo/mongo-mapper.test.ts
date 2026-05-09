import type { Document, WithId } from "mongodb";

import { expect, test } from "bun:test";

import type { Model } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";
import type { MongoDoc } from "@/vendor/mongo/mongo-type";

import { Err } from "@/shared/err/err";
import {
  mapFromMongoDoc,
  mapMongoError,
  mapToMongoDoc,
} from "@/vendor/mongo/mongo-mapper";

const TEST_ID = "019606a0-0000-7000-8000-000000000001" as Id;

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

test("mapToMongoDoc: given a model with id, when mapped, then renames id to _id and preserves other fields", () => {
  // given
  const model: Model<Document & { name: string }> = {
    id: TEST_ID,
    _version: 1,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    name: "test",
  };

  // when
  const doc = mapToMongoDoc(model);

  // then
  expect(doc).toEqual({
    _id: TEST_ID,
    _version: 1,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    name: "test",
  });
  expect(doc).not.toHaveProperty("id");
});

test("mapFromMongoDoc: given a mongo doc with _id, when mapped, then renames _id to id and preserves other fields", () => {
  // given
  const doc: WithId<MongoDoc> = {
    _id: TEST_ID,
    _version: 1,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    name: "test",
  };

  // when
  const model = mapFromMongoDoc<Model<Document & { name: string }>>(doc);

  // then
  expect(model).toEqual({
    id: TEST_ID,
    _version: 1,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    name: "test",
  });
  expect(model).not.toHaveProperty("_id");
});
