import { beforeEach, describe, expect, it, mock } from "bun:test";

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
const { sendOtpEmail, sendInvitationEmail } =
  await import("./better-auth-util");

// --- Helpers ---

const RESEND_FROM_ADDRESS = "noreply@test.com";
const BETTER_AUTH_URL = "http://localhost:8000";

// --- Tests ---

describe("sendOtpEmail", () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockSend.mockResolvedValue(undefined);
    process.env.RESEND_FROM_ADDRESS = RESEND_FROM_ADDRESS;
  });

  it("should send sign-in OTP email with correct subject", async () => {
    await sendOtpEmail({
      email: "user@test.com",
      otp: "123456",
      type: "sign-in",
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@test.com",
        from: RESEND_FROM_ADDRESS,
        subject: "Your sign-in code",
      }),
    );
  });

  it("should send email-verification OTP email with correct subject", async () => {
    await sendOtpEmail({
      email: "user@test.com",
      otp: "654321",
      type: "email-verification",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Verify your email",
      }),
    );
  });

  it("should send forget-password OTP email with correct subject", async () => {
    await sendOtpEmail({
      email: "user@test.com",
      otp: "111111",
      type: "forget-password",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Reset your password",
      }),
    );
  });

  it("should include OTP in the email body", async () => {
    await sendOtpEmail({
      email: "user@test.com",
      otp: "987654",
      type: "sign-in",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("987654"),
      }),
    );
  });

  it("should include subject heading in the email body", async () => {
    await sendOtpEmail({
      email: "user@test.com",
      otp: "123456",
      type: "email-verification",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("Verify your email"),
      }),
    );
  });

  it("should return ok result on success", async () => {
    const result = await sendOtpEmail({
      email: "user@test.com",
      otp: "123456",
      type: "sign-in",
    });

    expect(result.isOk()).toBe(true);
  });

  it("should return err result on failure", async () => {
    mockSend.mockRejectedValueOnce(new Error("Send failed"));

    const result = await sendOtpEmail({
      email: "user@test.com",
      otp: "123456",
      type: "sign-in",
    });

    expect(result.isErr()).toBe(true);
  });
});

describe("sendInvitationEmail", () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockSend.mockResolvedValue(undefined);
    process.env.RESEND_FROM_ADDRESS = RESEND_FROM_ADDRESS;
    process.env.BETTER_AUTH_URL = BETTER_AUTH_URL;
  });

  it("should send invitation email with correct recipient and subject", async () => {
    await sendInvitationEmail({
      id: "inv-123",
      email: "invitee@test.com",
      organizationName: "Acme Corp",
      inviterName: "Alice",
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "invitee@test.com",
        from: RESEND_FROM_ADDRESS,
        subject: "You've been invited to Acme Corp",
      }),
    );
  });

  it("should include inviter name and organization in the body", async () => {
    await sendInvitationEmail({
      id: "inv-123",
      email: "invitee@test.com",
      organizationName: "Acme Corp",
      inviterName: "Alice",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("Alice"),
      }),
    );
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("Acme Corp"),
      }),
    );
  });

  it("should include accept invitation link with correct id", async () => {
    await sendInvitationEmail({
      id: "inv-456",
      email: "invitee@test.com",
      organizationName: "Acme Corp",
      inviterName: "Bob",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(
          `${BETTER_AUTH_URL}/accept-invitation/inv-456`,
        ),
      }),
    );
  });

  it("should return ok result on success", async () => {
    const result = await sendInvitationEmail({
      id: "inv-123",
      email: "invitee@test.com",
      organizationName: "Acme Corp",
      inviterName: "Alice",
    });

    expect(result.isOk()).toBe(true);
  });

  it("should return err result on failure", async () => {
    mockSend.mockRejectedValueOnce(new Error("Send failed"));

    const result = await sendInvitationEmail({
      id: "inv-123",
      email: "invitee@test.com",
      organizationName: "Acme Corp",
      inviterName: "Alice",
    });

    expect(result.isErr()).toBe(true);
  });
});
