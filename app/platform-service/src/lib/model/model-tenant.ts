import z from "zod";
import { idSchema } from "@/lib/model/model-id";

export const tenantTypes = ["organization", "user"] as const;

export const tenantSchema = z.object({
  id: idSchema,
  type: z.enum(tenantTypes),
});
export type Tenant = z.infer<typeof tenantSchema>;
