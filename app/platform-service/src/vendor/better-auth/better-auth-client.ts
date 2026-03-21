import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP, organization } from "better-auth/plugins";
import { newId } from "@/shared/model/model-id";
import { makeBetterAuthUtil } from "@/vendor/better-auth/better-auth-util";
import { getEnv } from "@/vendor/env/env";
import { mongoClient } from "@/vendor/mongo/mongo-client";

const betterAuthUtil = makeBetterAuthUtil();

const betterAuthClient = betterAuth({
  secret: getEnv().BETTER_AUTH_SECRET,
  baseURL: getEnv().BETTER_AUTH_URL,
  trustedOrigins: getEnv().BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? [],

  database: mongodbAdapter(mongoClient.db(getEnv().MONGO_DB_NAME), {
    client: mongoClient,
  }),

  emailAndPassword: { enabled: false },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      sendVerificationOTP: async (data) => {
        const result = await betterAuthUtil.sendOtpEmail(data);
        if (result.isErr()) {
          throw result.error;
        }
      },
    }),

    organization({
      sendInvitationEmail: async (data) => {
        const result = await betterAuthUtil.sendInvitationEmail({
          id: data.id,
          email: data.email,
          organizationName: data.organization.name,
          inviterName: data.inviter.user.name ?? data.inviter.user.email,
        });
        if (result.isErr()) {
          throw result.error;
        }
      },
    }),
  ],

  advanced: {
    database: {
      generateId: () => newId(),
    },
  },
});

export { betterAuthClient };
