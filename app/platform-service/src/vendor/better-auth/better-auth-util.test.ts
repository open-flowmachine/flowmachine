import { beforeEach, expect, mock, test } from "bun:test";

import { MOCK_BETTER_AUTH_URL, MOCK_RESEND_FROM_ADDRESS } from "@/test-setup";

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
const { makeBetterAuthUtil } = await import("./better-auth-util");
const { sendOtpEmail, sendInvitationEmail } = makeBetterAuthUtil();

// --- Tests ---

beforeEach(() => {
  mockSend.mockClear();
  mockSend.mockResolvedValue(undefined);
});

test("sendOtpEmail: given a sign-in type, when called, then sends email with correct subject", async () => {
  // given

  // when
  await sendOtpEmail({
    email: "user@test.com",
    otp: "123456",
    type: "sign-in",
  });

  // then
  expect(mockSend).toHaveBeenCalledTimes(1);
  expect(mockSend).toHaveBeenCalledWith(
    expect.objectContaining({
      to: "user@test.com",
      from: MOCK_RESEND_FROM_ADDRESS,
      subject: "Your sign-in code",
    }),
  );
});

test("sendOtpEmail: given an email-verification type, when called, then sends email with correct subject", async () => {
  // given

  // when
  await sendOtpEmail({
    email: "user@test.com",
    otp: "654321",
    type: "email-verification",
  });

  // then
  expect(mockSend).toHaveBeenCalledWith(
    expect.objectContaining({
      subject: "Verify your email",
    }),
  );
});

test("sendOtpEmail: given a forget-password type, when called, then sends email with correct subject", async () => {
  // given

  // when
  await sendOtpEmail({
    email: "user@test.com",
    otp: "111111",
    type: "forget-password",
  });

  // then
  expect(mockSend).toHaveBeenCalledWith(
    expect.objectContaining({
      subject: "Reset your password",
    }),
  );
});

test("sendOtpEmail: given a valid OTP, when called, then includes OTP in email body", async () => {
  // given

  // when
  await sendOtpEmail({
    email: "user@test.com",
    otp: "987654",
    type: "sign-in",
  });

  // then
  expect(mockSend).toHaveBeenCalledWith(
    expect.objectContaining({
      html: expect.stringContaining("987654"),
    }),
  );
});

test("sendOtpEmail: given an email-verification type, when called, then includes subject heading in email body", async () => {
  // given

  // when
  await sendOtpEmail({
    email: "user@test.com",
    otp: "123456",
    type: "email-verification",
  });

  // then
  expect(mockSend).toHaveBeenCalledWith(
    expect.objectContaining({
      html: expect.stringContaining("Verify your email"),
    }),
  );
});

test("sendOtpEmail: given a valid input, when send succeeds, then returns ok result", async () => {
  // given

  // when
  const result = await sendOtpEmail({
    email: "user@test.com",
    otp: "123456",
    type: "sign-in",
  });

  // then
  expect(result.isOk()).toBe(true);
});

test("sendOtpEmail: given a valid input, when send throws, then returns err result", async () => {
  // given
  mockSend.mockRejectedValueOnce(new Error("Send failed"));

  // when
  const result = await sendOtpEmail({
    email: "user@test.com",
    otp: "123456",
    type: "sign-in",
  });

  // then
  expect(result.isErr()).toBe(true);
});

test("sendInvitationEmail: given valid invitation details, when called, then sends email with correct recipient and subject", async () => {
  // given

  // when
  await sendInvitationEmail({
    id: "inv-123",
    email: "invitee@test.com",
    organizationName: "Acme Corp",
    inviterName: "Alice",
  });

  // then
  expect(mockSend).toHaveBeenCalledTimes(1);
  expect(mockSend).toHaveBeenCalledWith(
    expect.objectContaining({
      to: "invitee@test.com",
      from: MOCK_RESEND_FROM_ADDRESS,
      subject: "You've been invited to Acme Corp",
    }),
  );
});

test("sendInvitationEmail: given inviter and organization, when called, then includes them in email body", async () => {
  // given

  // when
  await sendInvitationEmail({
    id: "inv-123",
    email: "invitee@test.com",
    organizationName: "Acme Corp",
    inviterName: "Alice",
  });

  // then
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

test("sendInvitationEmail: given an invitation id, when called, then includes accept link with correct id in body", async () => {
  // given

  // when
  await sendInvitationEmail({
    id: "inv-456",
    email: "invitee@test.com",
    organizationName: "Acme Corp",
    inviterName: "Bob",
  });

  // then
  expect(mockSend).toHaveBeenCalledWith(
    expect.objectContaining({
      html: expect.stringContaining(
        `${MOCK_BETTER_AUTH_URL}/accept-invitation/inv-456`,
      ),
    }),
  );
});

test("sendInvitationEmail: given a valid input, when send succeeds, then returns ok result", async () => {
  // given

  // when
  const result = await sendInvitationEmail({
    id: "inv-123",
    email: "invitee@test.com",
    organizationName: "Acme Corp",
    inviterName: "Alice",
  });

  // then
  expect(result.isOk()).toBe(true);
});

test("sendInvitationEmail: given a valid input, when send throws, then returns err result", async () => {
  // given
  mockSend.mockRejectedValueOnce(new Error("Send failed"));

  // when
  const result = await sendInvitationEmail({
    id: "inv-123",
    email: "invitee@test.com",
    organizationName: "Acme Corp",
    inviterName: "Alice",
  });

  // then
  expect(result.isErr()).toBe(true);
});
