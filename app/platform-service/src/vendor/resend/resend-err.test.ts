import { describe, expect, it } from "bun:test";
import { Err } from "@/shared/err/err";
import { mapResendError } from "@/vendor/resend/resend-err";

describe("mapResendError", () => {
  it("should map a plain Error to Err with resend message", () => {
    const result = mapResendError(new Error("API timeout"));

    expect(result).toBeInstanceOf(Err);
    expect(result.message).toBe("Resend email service error");
    expect(result.code).toBe("unknown");
  });

  it("should map a non-Error value to Err with resend message", () => {
    const result = mapResendError("something went wrong");

    expect(result).toBeInstanceOf(Err);
    expect(result.message).toBe("Resend email service error");
  });

  it("should return the original Err if already an Err", () => {
    const original = Err.code("notFound");

    const result = mapResendError(original);

    expect(result).toBe(original);
  });
});
