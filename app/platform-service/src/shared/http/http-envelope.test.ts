import { describe, expect, it } from "bun:test";
import { Err } from "@/shared/err/err";
import { errEnvelope, okEnvelope } from "@/shared/http/http-envelope";

describe("okEnvelope", () => {
  it("should return default envelope when called with no arguments", () => {
    const result = okEnvelope();

    expect(result).toEqual({ status: 200, code: "ok", message: "ok" });
  });

  it("should include data when provided", () => {
    const result = okEnvelope({ data: { id: "abc" } });

    expect(result).toEqual({
      status: 200,
      code: "ok",
      message: "ok",
      data: { id: "abc" },
    });
  });

  it("should omit data when undefined", () => {
    const result = okEnvelope({ data: undefined });

    expect(result).not.toHaveProperty("data");
    expect(result).toEqual({ status: 200, code: "ok", message: "ok" });
  });

  it("should allow overriding status, code, and message", () => {
    const result = okEnvelope({
      status: 201,
      code: "created",
      message: "Resource created",
    });

    expect(result).toEqual({
      status: 201,
      code: "created",
      message: "Resource created",
    });
  });
});

describe("errEnvelope", () => {
  it("should return envelope from Err with notFound code", () => {
    const result = errEnvelope(Err.code("notFound"));

    expect(result).toEqual({
      status: 404,
      code: "notFound",
      message: "Resource not found",
    });
  });

  it("should return envelope from Err with unknown code", () => {
    const result = errEnvelope(Err.code("unknown"));

    expect(result).toEqual({
      status: 500,
      code: "unknown",
      message: "Internal server error",
    });
  });

  it("should use custom message when provided", () => {
    const result = errEnvelope(
      Err.code("badRequest", { message: "Invalid input" }),
    );

    expect(result).toEqual({
      status: 400,
      code: "badRequest",
      message: "Invalid input",
    });
  });
});
