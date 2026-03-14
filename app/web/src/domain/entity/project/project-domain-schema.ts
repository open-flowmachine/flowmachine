import { z } from "zod/v4";
import {
  domainIdSchema,
  tenantAwareBaseDomainSchema,
} from "@/domain/entity/shared-schema";

export const projectProviders = ["jira", "linear"] as const;

const projectIntegrationSchema = z.object({
  domain: z.string(),
  externalId: z.string(),
  externalKey: z.string(),
  provider: z.enum(projectProviders),
  webhookSecret: z.string(),
  credentialId: domainIdSchema,
});

export const projectDomainSchema = z.object({
  ...tenantAwareBaseDomainSchema.shape,
  name: z.string(),
  integration: projectIntegrationSchema.optional(),
});
export type ProjectDomain = z.infer<typeof projectDomainSchema>;
