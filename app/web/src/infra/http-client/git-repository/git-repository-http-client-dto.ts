import { z } from "zod/v4";
import {
  idParamsSchema,
  tenantAwareBaseHttpClientResponseDtoSchema,
} from "@/infra/http-client/shared/http-envelope-schema";

const gitProviders = ["github", "gitlab"] as const;

export const gitRepositoryConfigHttpDtoSchema = z.object({
  defaultBranch: z.string(),
  email: z.string(),
  username: z.string(),
});

export const gitRepositoryIntegrationHttpDtoSchema = z.object({
  provider: z.enum(gitProviders),
  credentialId: z.string(),
});

const projectHttpResponseDtoSchema = z.object({
  id: z.string(),
  syncStatus: z.enum(["idle", "pending", "success", "error"]),
  syncedAt: z.iso.datetime().nullable(),
});

export const gitRepositoryHttpResponseDtoSchema = z.object({
  ...tenantAwareBaseHttpClientResponseDtoSchema.shape,
  name: z.string(),
  url: z.string(),
  config: gitRepositoryConfigHttpDtoSchema,
  integration: gitRepositoryIntegrationHttpDtoSchema,
  projects: z.array(projectHttpResponseDtoSchema),
});
export type GitRepositoryHttpResponseDto = z.output<
  typeof gitRepositoryHttpResponseDtoSchema
>;

export const createGitRepositoryHttpRequestBodyDtoSchema = z.object({
  name: z.string().min(1).max(256),
  url: z.string(),
  config: gitRepositoryConfigHttpDtoSchema,
  integration: gitRepositoryIntegrationHttpDtoSchema,
  projects: z.array(projectHttpResponseDtoSchema),
});
export type CreateGitRepositoryHttpRequestBodyDto = z.output<
  typeof createGitRepositoryHttpRequestBodyDtoSchema
>;

export const updateGitRepositoryHttpRequestBodyDtoSchema =
  createGitRepositoryHttpRequestBodyDtoSchema.partial();
export type UpdateGitRepositoryHttpRequestBodyDto = z.output<
  typeof updateGitRepositoryHttpRequestBodyDtoSchema
>;

export const createGitRepositoryHttpClientInSchema = z.object({
  payload: createGitRepositoryHttpRequestBodyDtoSchema,
});
export type CreateGitRepositoryHttpClientIn = z.output<
  typeof createGitRepositoryHttpClientInSchema
>;

export const updateGitRepositoryHttpClientInSchema = z.object({
  payload: z.object({
    id: z.string(),
    body: updateGitRepositoryHttpRequestBodyDtoSchema,
  }),
});
export type UpdateGitRepositoryHttpClientIn = z.output<
  typeof updateGitRepositoryHttpClientInSchema
>;

export const deleteGitRepositoryClientInSchema = z.object({
  payload: idParamsSchema,
});
export type DeleteGitRepositoryClientIn = z.output<
  typeof deleteGitRepositoryClientInSchema
>;

export const getGitRepositoryByIdClientInSchema = z.object({
  payload: idParamsSchema,
});
export type GetGitRepositoryByIdClientIn = z.output<
  typeof getGitRepositoryByIdClientInSchema
>;
