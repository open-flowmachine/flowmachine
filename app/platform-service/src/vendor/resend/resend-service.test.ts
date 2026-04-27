import { afterAll, beforeEach, expect, spyOn, test } from "bun:test";

import { Err } from "@/shared/err/err";
import { resendClient } from "@/vendor/resend/resend-client";
import { makeResendService } from "@/vendor/resend/resend-service";

// --- Mock setup ---

const mockSend = spyOn(resendClient.emails, "send");

const resendService = makeResendService();

// --- Helpers ---

const makePayload = (
  overrides?: Partial<Parameters<typeof resendService.sendEmail>[0]["payload"]>,
) => ({
  from: "noreply@example.com",
  to: "user@example.com",
  subject: "Test Subject",
  bodyHtml: "<p>Hello</p>",
  ...overrides,
});

// --- Tests ---

beforeEach(() => {
  mockSend.mockReset();
  mockSend.mockResolvedValue(undefined as never);
});

afterAll(() => {
  mockSend.mockRestore();
});

test("sendEmail: given a valid payload, when sent, then calls resend client with correct parameters", async () => {
  // given
  const payload = makePayload();

  // when
  await resendService.sendEmail({ payload });

  // then
  expect(mockSend).toHaveBeenCalledWith({
    from: "noreply@example.com",
    to: "user@example.com",
    subject: "Test Subject",
    html: "<p>Hello</p>",
  });
});

test("sendEmail: given a valid payload, when sent successfully, then returns ok result", async () => {
  // given
  const payload = makePayload();

  // when
  const result = await resendService.sendEmail({ payload });

  // then
  expect(result.isOk()).toBe(true);
});

test("sendEmail: given resend client throws, when sent, then returns err result with resend message", async () => {
  // given
  mockSend.mockRejectedValueOnce(new Error("Resend API error"));
  const payload = makePayload();

  // when
  const result = await resendService.sendEmail({ payload });

  // then
  expect(result.isErr()).toBe(true);
  expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
  expect(result._unsafeUnwrapErr()).toHaveProperty(
    "message",
    "Resend email service error",
  );
});
