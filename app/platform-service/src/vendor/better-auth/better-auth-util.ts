import { type EmailOTPOptions } from "better-auth/plugins";
import { makeResendService } from "@/vendor/resend/resend-util";

const resendService = makeResendService();

const otpTypeToEmailSubject = {
  "sign-in": "Your sign-in code",
  "email-verification": "Verify your email",
  "forget-password": "Reset your password",
} as const;

const sendOtpEmail = async (
  body: Parameters<EmailOTPOptions["sendVerificationOTP"]>[0],
) => {
  return await resendService.sendEmail({
    payload: {
      from: process.env.RESEND_FROM_ADDRESS,
      to: body.email,
      subject: otpTypeToEmailSubject[body.type],
      bodyHtml: `
        <div>
          <h1>${otpTypeToEmailSubject[body.type]}</h1>
          <p>Your verification code is:</p>
          <h2 style="font-size: 32px; letter-spacing: 8px;">${body.otp}</h2>
          <p>This code expires in 5 minutes.</p>
        </div>
      `,
    },
  });
};

const sendInvitationEmail = (data: {
  id: string;
  email: string;
  organizationName: string;
  inviterName: string;
}) => {
  return resendService.sendEmail({
    payload: {
      from: process.env.RESEND_FROM_ADDRESS,
      to: data.email,
      subject: `You've been invited to ${data.organizationName}`,
      bodyHtml: `
          <div>
            <h1>You've been invited!</h1>
            <p>${data.inviterName} invited you to join <strong>${data.organizationName}</strong>.</p>
            <a href="${process.env.BETTER_AUTH_URL}/accept-invitation/${data.id}"
               style="display: inline-block; padding: 12px 24px;
                      background: #000; color: #fff; text-decoration: none;
                      border-radius: 6px; margin-top: 16px;">
              Accept Invitation
            </a>
          </div>
        `,
    },
  });
};

const makeBetterAuthUtil = () => ({ sendOtpEmail, sendInvitationEmail });

export { makeBetterAuthUtil };
