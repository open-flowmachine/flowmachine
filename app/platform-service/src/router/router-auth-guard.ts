import Elysia from "elysia";
import { isNil } from "es-toolkit";

import type { Tenant } from "@/shared/tenant/tenant-model";
import type { Logger } from "@/vendor/pino/pino-logger";

import { Err } from "@/shared/err/err";
import { betterAuthClient } from "@/vendor/better-auth/better-auth-client";

const routerAuthGuard = (
  app: Elysia<
    "",
    {
      decorator: {};
      derive: { logger: Logger };
      resolve: {};
      store: {};
    }
  >,
) =>
  app.resolve({ as: "scoped" }, async ({ headers, logger }) => {
    try {
      const result = await betterAuthClient.api.getSession({
        headers: new Headers(headers as Record<string, string>),
      });

      if (!result) {
        throw Err.code("unauthorized");
      }
      const session = result.session;

      if (isNil(session.activeOrganizationId)) {
        const tenant: Tenant = {
          id: session.userId,
          type: "user",
        };
        return { tenant } as const;
      }
      const tenant: Tenant = {
        id: session.activeOrganizationId,
        type: "organization",
      };

      logger.info({ tenant }, "Request authenticated");
      return { logger: logger.child({ tenant }), tenant } as const;
    } catch (error) {
      throw Err.from(error);
    }
  });

export { routerAuthGuard };
