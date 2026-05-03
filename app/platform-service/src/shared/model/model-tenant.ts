import z from "zod";

import { idSchema } from "@/shared/model/model-id";

const tenantTypes = ["organization", "user"] as const;

const tenantSchema = z.object({
  id: idSchema,
  type: z.enum(tenantTypes),
});
type Tenant = z.infer<typeof tenantSchema>;

type TenantToggle<T extends Record<string, unknown>> = Omit<T, "tenant"> &
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

export { tenantSchema };
export type { Tenant, TenantToggle };
