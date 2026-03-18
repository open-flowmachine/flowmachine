import { Err } from "@/err/err";

const mapResendError = (error: unknown) => {
  return Err.from(error, { message: "Resend email service error" });
};

export { mapResendError };
