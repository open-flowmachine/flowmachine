import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP, organization } from "better-auth/plugins";
import {
  sendInvitationEmail,
  sendOtpEmail,
} from "@/lib/better-auth/better-auth-util";
import { newId } from "@/lib/model/model-id";
import { mongoClient } from "@/lib/mongo/mongo-client";

const betterAuthClient = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? [],

  database: mongodbAdapter(mongoClient.db(process.env.DATABASE_NAME), {
    client: mongoClient,
  }),

  emailAndPassword: { enabled: false },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      sendVerificationOTP: async (data) => {
        const result = await sendOtpEmail(data);
        if (result.isErr()) {
          throw result.error;
        }
      },
    }),

    organization({
      sendInvitationEmail: async (data) => {
        const result = await sendInvitationEmail({
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
