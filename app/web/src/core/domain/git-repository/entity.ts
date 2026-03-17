import { z } from "zod/v4";
import {
  datetimeSchema,
  domainIdSchema,
  tenantAwareBaseDomainSchema,
} from "@/core/domain/shared";

const gitProviders = ["github", "gitlab"] as const;

const gitRepositoryConfigSchema = z.object({
  defaultBranch: z.string(),
  email: z.string(),
  username: z.string(),
});

const gitRepositoryIntegrationSchema = z.object({
  provider: z.enum(gitProviders),
  credentialId: z.string(),
});

export const gitRepositoryDomainSchema = z.object({
  ...tenantAwareBaseDomainSchema.shape,
  name: z.string(),
  url: z.string(),
  config: gitRepositoryConfigSchema,
  integration: gitRepositoryIntegrationSchema,
  projects: z.array(
    z.object({
      id: domainIdSchema,
      syncStatus: z.enum(["idle", "pending", "success", "error"]),
      syncedAt: datetimeSchema.nullable(),
    }),
  ),
});
export type GitRepositoryDomain = z.infer<typeof gitRepositoryDomainSchema>;
