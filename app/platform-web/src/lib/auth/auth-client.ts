import { emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { getEnv } from "@/lib/env/env";

export const authClient = createAuthClient({
  baseURL: getEnv().NEXT_PUBLIC_SERVICE_BASE_URL + "/api/auth",
  plugins: [emailOTPClient(), organizationClient()],
});
