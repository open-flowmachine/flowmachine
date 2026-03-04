import { z } from "zod/v4";
import { gitRepositoryDomainSchema } from "@/domain/entity/git-repository/git-repository-domain-schema";
import { domainIdSchema } from "@/domain/entity/shared-schema";

export const newGitRepositoryFormValuesSchema = z.object({
  name: gitRepositoryDomainSchema.shape.name,
  url: gitRepositoryDomainSchema.shape.url,
  config: gitRepositoryDomainSchema.shape.config,
  integration: gitRepositoryDomainSchema.shape.integration,
  projects: z.array(domainIdSchema),
});

export type NewGitRepositoryFormValues = z.infer<
  typeof newGitRepositoryFormValuesSchema
>;
