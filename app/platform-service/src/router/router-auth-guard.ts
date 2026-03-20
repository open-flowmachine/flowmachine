import Elysia from "elysia";
import { isNil } from "es-toolkit";
import { Err } from "@/shared/err/err";
import type { Tenant } from "@/shared/model/model-tenant";
import { betterAuthClient } from "@/vendor/better-auth/better-auth-client";

const routerAuthGuard = new Elysia({ name: "httpAuthGuard" }).resolve(
  { as: "scoped" },
  async ({ headers }) => {
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

      return { tenant } as const;
    } catch (error) {
      throw Err.from(error);
    }
  },
);

export { routerAuthGuard };
