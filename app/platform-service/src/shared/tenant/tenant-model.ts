import z from "zod";

import { idSchema } from "@/shared/model/model-id";

const tenantTypes = ["organization", "user"] as const;

const tenantSchema = z.object({
  id: idSchema,
  type: z.enum(tenantTypes),
});
type Tenant = z.infer<typeof tenantSchema>;

type TenantAware<T extends Record<string, unknown> = Record<string, unknown>> =
  T &
    (
      | {
          dangerouslyDisableTenant: true;
          tenant?: undefined;
        }
      | {
          dangerouslyDisableTenant?: false | undefined;
          tenant: Tenant;
        }
    );

type TenantUnaware<
  T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
  dangerouslyDisableTenant?: false | undefined;
  tenant?: undefined;
};

type TenantAwareEnabled = true;
type TenantAwareDisabled = false;

export { tenantSchema };
export type {
  Tenant,
  TenantAware,
  TenantUnaware,
  TenantAwareDisabled,
  TenantAwareEnabled,
};
