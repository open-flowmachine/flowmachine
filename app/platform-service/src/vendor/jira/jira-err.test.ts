import { describe, expect, it } from "bun:test";
import { Err } from "@/shared/err/err";
import { mapJiraError } from "@/vendor/jira/jira-err";

describe("mapJiraError", () => {
  it("should map a plain Error to Err with jira message", () => {
    const result = mapJiraError(new Error("timeout"));

    expect(result).toBeInstanceOf(Err);
    expect(result.message).toBe("Jira API error");
    expect(result.code).toBe("unknown");
  });

  it("should map a non-Error value to Err with jira message", () => {
    const result = mapJiraError("something went wrong");

    expect(result).toBeInstanceOf(Err);
    expect(result.message).toBe("Jira API error");
  });

  it("should return the original Err if already an Err", () => {
    const original = Err.code("notFound");

    const result = mapJiraError(original);

    expect(result).toBe(original);
  });
});
