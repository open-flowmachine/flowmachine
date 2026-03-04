import z from "zod";
import { tenantSchema } from "@/core/domain/tenant-aware-entity";

const tenantCtxSchema = z.object({
  tenant: tenantSchema,
});
type TenantCtx = z.infer<typeof tenantCtxSchema>;

export { type TenantCtx, tenantCtxSchema };
