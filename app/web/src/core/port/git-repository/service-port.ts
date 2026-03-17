import { z } from "zod/v4";
import { gitRepositoryDomainSchema } from "@/core/domain/git-repository/entity";
import { domainIdSchema } from "@/core/domain/shared";

export const createGitRepositoryServicePortInSchema = z.object({
  body: z.object({
    name: gitRepositoryDomainSchema.shape.name,
    url: gitRepositoryDomainSchema.shape.url,
    config: gitRepositoryDomainSchema.shape.config,
    integration: gitRepositoryDomainSchema.shape.integration,
    projects: gitRepositoryDomainSchema.shape.projects,
  }),
});
export type CreateGitRepositoryServicePortIn = z.output<
  typeof createGitRepositoryServicePortInSchema
>;

export const deleteGitRepositoryServicePortInSchema = z.object({
  params: z.object({
    id: domainIdSchema,
  }),
});
export type DeleteGitRepositoryServicePortIn = z.output<
  typeof deleteGitRepositoryServicePortInSchema
>;

export const getGitRepositoryServicePortInSchema = z.object({
  params: z.object({
    id: domainIdSchema,
  }),
});
export type GetGitRepositoryServicePortIn = z.output<
  typeof getGitRepositoryServicePortInSchema
>;

export const updateGitRepositoryServicePortInSchema = z.object({
  params: z.object({
    id: domainIdSchema,
  }),
  body: z.object({
    name: gitRepositoryDomainSchema.shape.name.optional(),
    url: gitRepositoryDomainSchema.shape.url.optional(),
    config: gitRepositoryDomainSchema.shape.config.optional(),
    integration: gitRepositoryDomainSchema.shape.integration.optional(),
    projects: gitRepositoryDomainSchema.shape.projects.optional(),
  }),
});
export type UpdateGitRepositoryServicePortIn = z.output<
  typeof updateGitRepositoryServicePortInSchema
>;
