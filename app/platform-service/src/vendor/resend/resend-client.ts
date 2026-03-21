import { Resend } from "resend";
import { getEnv } from "@/vendor/env/env";

const resendClient = new Resend(getEnv().RESEND_API_KEY);

export { resendClient };
