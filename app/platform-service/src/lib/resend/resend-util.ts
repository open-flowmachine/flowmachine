import { err, ok } from "neverthrow";
import { resendClient } from "@/lib/resend/resend-client";
import { mapResendError } from "@/lib/resend/resend-err";

const sendEmail = async (input: {
  payload: { from: string; to: string; subject: string; bodyHtml: string };
}) => {
  const { payload } = input;
  const { from, to, subject, bodyHtml } = payload;

  try {
    await resendClient.emails.send({
      from,
      to,
      subject,
      html: bodyHtml,
    });
    return ok();
  } catch (error) {
    return err(mapResendError(error));
  }
};

export { sendEmail };
