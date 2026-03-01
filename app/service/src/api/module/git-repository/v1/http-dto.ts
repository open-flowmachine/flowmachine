import z from "zod";
import { entityIdSchema } from "@/core/domain/entity";
import { gitRepositoryCrudServiceInputSchema } from "@/core/domain/git-repository/crud-service";
import { gitRepositoryEntityProps } from "@/core/domain/git-repository/entity";
import { tenantSchema } from "@/core/domain/tenant-aware-entity";

const gitRepositoryResponseDtoSchema = z.object({
  id: entityIdSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  tenant: tenantSchema,
  name: gitRepositoryEntityProps.shape.name,
  url: gitRepositoryEntityProps.shape.url,
  config: gitRepositoryEntityProps.shape.config,
  integration: gitRepositoryEntityProps.shape.integration,
  projects: gitRepositoryEntityProps.shape.projects,
});
type GitRepositoryResponseDto = z.output<typeof gitRepositoryResponseDtoSchema>;

const postGitRepositoryRequestBodyDtoSchema = z.object({
  name: gitRepositoryCrudServiceInputSchema.create.shape.payload.shape.name,
  url: gitRepositoryCrudServiceInputSchema.create.shape.payload.shape.url,
  config: gitRepositoryCrudServiceInputSchema.create.shape.payload.shape.config,
  integration:
    gitRepositoryCrudServiceInputSchema.create.shape.payload.shape.integration,
  projects:
    gitRepositoryCrudServiceInputSchema.create.shape.payload.shape.projects,
});

const patchGitRepositoryRequestParamsDtoSchema = z.object({
  id: entityIdSchema,
});

const patchGitRepositoryRequestBodyDtoSchema = z.object({
  name: gitRepositoryEntityProps.shape.name.optional(),
  url: gitRepositoryEntityProps.shape.url.optional(),
  config: gitRepositoryEntityProps.shape.config.optional(),
  integration: gitRepositoryEntityProps.shape.integration.optional(),
  projects: gitRepositoryEntityProps.shape.projects.optional(),
});

const deleteGitRepositoryRequestParamsDtoSchema = z.object({
  id: entityIdSchema,
});

export {
  gitRepositoryResponseDtoSchema,
  type GitRepositoryResponseDto,
  postGitRepositoryRequestBodyDtoSchema,
  patchGitRepositoryRequestParamsDtoSchema,
  patchGitRepositoryRequestBodyDtoSchema,
  deleteGitRepositoryRequestParamsDtoSchema,
};
