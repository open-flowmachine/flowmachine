import z from "zod";
import { idSchema } from "@/shared/model/model-id";

const tenantTypes = ["organization", "user"] as const;

const tenantSchema = z.object({
  id: idSchema,
  type: z.enum(tenantTypes),
});
type Tenant = z.infer<typeof tenantSchema>;

export { tenantSchema, type Tenant };
