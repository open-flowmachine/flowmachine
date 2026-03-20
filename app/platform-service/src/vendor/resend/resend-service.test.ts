import { beforeEach, describe, expect, it, mock } from "bun:test";
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

describe("sendEmail", () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockSend.mockResolvedValue(undefined);
  });

  it("should call resend client with correct parameters", async () => {
    const payload = makePayload();

    await resendService.sendEmail({ payload });

    expect(mockSend).toHaveBeenCalledWith({
      from: "noreply@example.com",
      to: "user@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
    });
  });

  it("should return ok on success", async () => {
    const result = await resendService.sendEmail({ payload: makePayload() });

    expect(result.isOk()).toBe(true);
  });

  it("should return err on failure", async () => {
    mockSend.mockRejectedValueOnce(new Error("Resend API error"));

    const result = await resendService.sendEmail({ payload: makePayload() });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Err);
    expect(result._unsafeUnwrapErr()).toHaveProperty(
      "message",
      "Resend email service error",
    );
  });
});
