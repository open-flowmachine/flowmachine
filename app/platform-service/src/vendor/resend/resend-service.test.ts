import { beforeEach, expect, mock, test } from "bun:test";

import { Err } from "@/shared/err/err";

// --- Mock setup ---

const mockSend = mock(() => Promise.resolve());

mock.module("@/vendor/resend/resend-client", () => ({
  resendClient: {
    emails: {
      send: mockSend,
    },
  },
}));

// Import after mocking
const { makeResendService } = await import("./resend-service");
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
  mockSend.mockClear();
  mockSend.mockResolvedValue(undefined);
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
