import { safeFn } from "@/shared/err/err-util";
import { resendClient } from "@/vendor/resend/resend-client";
import { mapResendError } from "@/vendor/resend/resend-err";

const sendEmail = (input: {
  payload: { from: string; to: string; subject: string; bodyHtml: string };
}) => {
  const { from, to, subject, bodyHtml } = input.payload;
  return safeFn(async () => {
    await resendClient.emails.send({
      from,
      to,
      subject,
      html: bodyHtml,
    });
  }, mapResendError);
};

const makeResendService = () => ({ sendEmail });

export { makeResendService };
