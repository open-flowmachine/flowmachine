import { z } from "zod/v4";
import { gitRepositoryDomainSchema } from "@/core/domain/git-repository/entity";
import { domainIdSchema } from "@/core/domain/shared";

export const editGitRepositoryFormValuesSchema = z.object({
  name: gitRepositoryDomainSchema.shape.name,
  url: gitRepositoryDomainSchema.shape.url,
  config: gitRepositoryDomainSchema.shape.config,
  integration: gitRepositoryDomainSchema.shape.integration,
  projects: z.array(domainIdSchema),
});

export type EditGitRepositoryFormValues = z.infer<
  typeof editGitRepositoryFormValuesSchema
>;
