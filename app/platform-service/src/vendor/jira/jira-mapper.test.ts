import { expect, test } from "bun:test";

import { Err } from "@/shared/err/err";
import { mapJiraError } from "@/vendor/jira/jira-mapper";

test("mapJiraError: given a plain Error, when mapped, then returns Err with jira message and unknown code", () => {
  // given
  const cause = new Error("timeout");

  // when
  const result = mapJiraError(cause);

  // then
  expect(result).toBeInstanceOf(Err);
  expect(result.message).toBe("Jira API error");
  expect(result.code).toBe("unknown");
});

test("mapJiraError: given a non-Error value, when mapped, then returns Err with jira message", () => {
  // given
  const cause = "something went wrong";

  // when
  const result = mapJiraError(cause);

  // then
  expect(result).toBeInstanceOf(Err);
  expect(result.message).toBe("Jira API error");
});

test("mapJiraError: given an existing Err, when mapped, then returns the original Err unchanged", () => {
  // given
  const original = Err.code("notFound");

  // when
  const result = mapJiraError(original);

  // then
  expect(result).toBe(original);
});
