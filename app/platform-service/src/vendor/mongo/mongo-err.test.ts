import { describe, expect, it } from "bun:test";
import { Err } from "@/shared/err/err";
import { mapMongoError } from "@/vendor/mongo/mongo-err";

describe("mapMongoError", () => {
  it("should map a plain Error to Err with mongo message", () => {
    const result = mapMongoError(new Error("connection lost"));

    expect(result).toBeInstanceOf(Err);
    expect(result.message).toBe("Mongo database error");
    expect(result.code).toBe("unknown");
  });

  it("should map a non-Error value to Err with mongo message", () => {
    const result = mapMongoError("something went wrong");

    expect(result).toBeInstanceOf(Err);
    expect(result.message).toBe("Mongo database error");
  });

  it("should return the original Err if already an Err", () => {
    const original = Err.code("notFound");

    const result = mapMongoError(original);

    expect(result).toBe(original);
  });
});
