import { UTCDate } from "@date-fns/utc";
import { err, ok } from "neverthrow";
import type z from "zod";
import { Err } from "@/common/err/err";
import { MemberEntity } from "@/core/domain/iam/member/entity";
import { SessionEntity } from "@/core/domain/iam/session/entity";
import { UserEntity } from "@/core/domain/iam/user/entity";
import type {
  AuthService,
  authServiceInputSchema,
} from "@/core/feature/auth/service";
import type { BetterAuthClientFactory } from "@/infra/better-auth/client-factory";

class BetterAuthService implements AuthService {
  #betterAuthClient: ReturnType<BetterAuthClientFactory["make"]>;

  constructor(betterAuthClient: ReturnType<BetterAuthClientFactory["make"]>) {
    this.#betterAuthClient = betterAuthClient;
  }

  async getActiveSession(
    input: z.infer<typeof authServiceInputSchema.getActiveSession>,
  ) {
    const { headers } = input;

    try {
      const result = await this.#betterAuthClient.api.getSession({ headers });

      if (!result) {
        return err(Err.code("unauthorized"));
      }
      const session = result.session;

      return ok(
        SessionEntity.makeExisting(
          session.id,
          new UTCDate(session.createdAt),
          new UTCDate(session.updatedAt),
          {
            activeOrganizationId: session.activeOrganizationId ?? null,
            expiresAt: new UTCDate(session.expiresAt),
            userId: session.userId,
          },
        ),
      );
    } catch (error) {
      return err(Err.from(error));
    }
  }

  async getActiveUser(
    input: z.infer<typeof authServiceInputSchema.getActiveUser>,
  ) {
    const { headers } = input;

    try {
      const result = await this.#betterAuthClient.api.getSession({ headers });

      if (!result) {
        return err(Err.code("unauthorized"));
      }
      const user = result.user;

      return ok(
        UserEntity.makeExisting(
          user.id,
          new UTCDate(user.createdAt),
          new UTCDate(user.updatedAt),
          {
            email: user.email,
            emailVerified: user.emailVerified,
          },
        ),
      );
    } catch (error) {
      return err(Err.from(error));
    }
  }

  async getActiveMember(
    input: z.infer<typeof authServiceInputSchema.getActiveMember>,
  ) {
    const { headers } = input;

    try {
      const member = await this.#betterAuthClient.api.getActiveMember({
        headers,
      });

      if (!member) {
        return err(Err.code("unauthorized"));
      }

      return ok(
        MemberEntity.makeExisting(
          member.id,
          new UTCDate(member.createdAt),
          new UTCDate(member.createdAt), // better-auth does not return updatedAt for member, using createdAt as a placeholder
          {
            organizationId: member.organizationId,
            role: member.role,
            userId: member.userId,
          },
        ),
      );
    } catch (error) {
      return err(Err.from(error));
    }
  }
}

export { BetterAuthService };
