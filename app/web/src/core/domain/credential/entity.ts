import { z } from "zod/v4";
import {
  datetimeSchema,
  tenantAwareBaseDomainSchema,
} from "@/core/domain/shared";

export const credentialTypes = ["apiKey", "basic"] as const;

export const credentialDomainSchema = z.discriminatedUnion("type", [
  z.object({
    ...tenantAwareBaseDomainSchema.shape,
    type: z.literal("apiKey"),
    name: z.string(),
    apiKey: z.string(),
    expiredAt: datetimeSchema,
  }),
  z.object({
    ...tenantAwareBaseDomainSchema.shape,
    type: z.literal("basic"),
    name: z.string(),
    username: z.string(),
    password: z.string(),
    expiredAt: datetimeSchema,
  }),
]);
export type CredentialDomain = z.infer<typeof credentialDomainSchema>;
