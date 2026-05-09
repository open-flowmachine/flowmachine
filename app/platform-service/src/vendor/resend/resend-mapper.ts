import { Err } from "@/shared/err/err";

const mapResendError = (error: unknown) => {
  return Err.from(error, { message: "Resend email service error" });
};

export { mapResendError };
