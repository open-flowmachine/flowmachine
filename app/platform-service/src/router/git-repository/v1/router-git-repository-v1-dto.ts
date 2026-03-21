import z from "zod";
import { gitProviders } from "@/module/git-repository/git-repository-model";
import { idSchema } from "@/shared/model/model-id";

const configSchema = z.object({
  defaultBranch: z.string(),
  email: z.string(),
  username: z.string(),
});

const integrationSchema = z.object({
  provider: z.enum(gitProviders),
  credentialId: idSchema,
});

const projectSchema = z.object({
  id: idSchema,
});

const gitRepositoryResponseDtoSchema = z.object({
  id: idSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  name: z.string(),
  url: z.string(),
  config: configSchema,
  integration: integrationSchema,
  projects: z.array(projectSchema),
});
type GitRepositoryResponseDto = z.infer<typeof gitRepositoryResponseDtoSchema>;

const postGitRepositoryRequestBodyDtoSchema = z.object({
  name: z.string(),
  url: z.string(),
  config: configSchema,
  integration: integrationSchema,
  projects: z.array(projectSchema),
});

const getGitRepositoryRequestParamsDtoSchema = z.object({
  id: idSchema,
});

const getGitRepositoryListRequestQueryDtoSchema = z.object({
  projectId: idSchema.optional(),
});

const patchGitRepositoryRequestParamsDtoSchema = z.object({
  id: idSchema,
});

const patchGitRepositoryRequestBodyDtoSchema = z.object({
  name: z.string().optional(),
  url: z.string().optional(),
  config: configSchema.optional(),
  integration: integrationSchema.optional(),
  projects: z.array(projectSchema).optional(),
});

const deleteGitRepositoryRequestParamsDtoSchema = z.object({
  id: idSchema,
});

export {
  gitRepositoryResponseDtoSchema,
  type GitRepositoryResponseDto,
  postGitRepositoryRequestBodyDtoSchema,
  getGitRepositoryRequestParamsDtoSchema,
  getGitRepositoryListRequestQueryDtoSchema,
  patchGitRepositoryRequestParamsDtoSchema,
  patchGitRepositoryRequestBodyDtoSchema,
  deleteGitRepositoryRequestParamsDtoSchema,
};
