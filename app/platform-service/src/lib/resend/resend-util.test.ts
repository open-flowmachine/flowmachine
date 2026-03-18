import { beforeEach, describe, expect, it, mock } from "bun:test";

// --- Mock setup ---

const mockSend = mock(() => Promise.resolve());

mock.module("@/lib/resend/resend-client", () => ({
  resendClient: {
    emails: {
      send: mockSend,
    },
  },
}));

// Import after mocking
const { sendEmail } = await import("./resend-util");

// --- Helpers ---

const makePayload = (
  overrides?: Partial<Parameters<typeof sendEmail>[0]["payload"]>,
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

    await sendEmail({ payload });

    expect(mockSend).toHaveBeenCalledWith({
      from: "noreply@example.com",
      to: "user@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
    });
  });

  it("should return ok on success", async () => {
    const result = await sendEmail({ payload: makePayload() });

    expect(result.isOk()).toBe(true);
  });

  it("should return err on failure", async () => {
    const error = new Error("Resend API error");
    mockSend.mockRejectedValueOnce(error);

    const result = await sendEmail({ payload: makePayload() });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe(error);
  });
});
